
import React, { useState, useRef } from 'react';
/* Fix: Changed ClipboardText to Clipboard as ClipboardText is not exported from lucide-react */
import { Upload, FileType, CheckCircle2, AlertTriangle, Loader2, Info, Sparkles, Clipboard } from 'lucide-react';
import { Task, TaskStatus, TaskPriority } from '../types';
import { parseCSVDate, extractReviewDate, getProjectFromSummary, findColumnIndex } from '../utils';
import { GoogleGenAI, Type } from "@google/genai";

interface CSVImporterProps {
  onImport: (tasks: Task[]) => void;
}

export const CSVImporter: React.FC<CSVImporterProps> = ({ onImport }) => {
  const [mode, setMode] = useState<'csv' | 'ai'>('csv');
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CSV Parsing Logic
  const processCSV = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) throw new Error("檔案內容不足");

    const splitCSVLine = (line: string) => {
      const result = [];
      let cur = '';
      let inQuote = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuote = !inQuote;
        else if (char === ',' && !inQuote) {
          result.push(cur.trim().replace(/^"|"$/g, ''));
          cur = '';
        } else cur += char;
      }
      result.push(cur.trim().replace(/^"|"$/g, ''));
      return result;
    };

    const headers = splitCSVLine(lines[0]);
    const idx = {
      status: findColumnIndex(headers, ['status', '狀態', '状态']),
      type: findColumnIndex(headers, ['type', '類型', '类型', '問題類型', '问题类型']),
      priority: findColumnIndex(headers, ['priority', '優先', '优先', '优先级', '優先級']),
      summary: findColumnIndex(headers, ['summary', '摘要', '內容', '任务', '任務', '概要']),
      updated: findColumnIndex(headers, ['updated', '更新日期', '時間', '已更新']),
      eta: findColumnIndex(headers, ['eta', '完成時間', 'Finish ETA']),
      updateDetail: findColumnIndex(headers, ['update', '進度', 'Status Update']),
    };

    if (idx.summary === -1) throw new Error("找不到摘要欄位");

    return lines.slice(1).reduce((acc: Task[], row, i) => {
      const cols = splitCSVLine(row);
      const rawSummary = cols[idx.summary] || '';
      if (!rawSummary.trim()) return acc;

      const summary = rawSummary.trim();
      const statusStr = cols[idx.status]?.toLowerCase() || '';
      let status = TaskStatus.Todo;
      if (statusStr.includes('处理') || statusStr.includes('processing')) status = TaskStatus.Processing;
      if (statusStr.includes('完成') || statusStr.includes('done')) status = TaskStatus.Done;
      if (statusStr.includes('暫停') || statusStr.includes('suspended')) status = TaskStatus.Suspended;

      const statusUpdate = idx.updateDetail !== -1 ? cols[idx.updateDetail] : '';
      acc.push({
        id: `task-${Date.now()}-${i}`,
        status,
        type: idx.type !== -1 ? cols[idx.type] : 'General',
        priority: (cols[idx.priority] as TaskPriority) || TaskPriority.P3,
        summary,
        lastUpdated: parseCSVDate(cols[idx.updated]) || new Date(),
        finishEta: idx.eta !== -1 ? parseCSVDate(cols[idx.eta]) || new Date() : new Date(),
        statusUpdate: statusUpdate || '',
        reviewDate: extractReviewDate(statusUpdate),
        tags: [],
        project: getProjectFromSummary(summary)
      });
      return acc;
    }, []);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsParsing(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        onImport(processCSV(text));
        setIsParsing(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "解析失敗");
        setIsParsing(false);
      }
    };
    reader.readAsText(file);
  };

  const handleAIPaste = async () => {
    if (!pastedText.trim()) return;
    setIsParsing(true);
    setError(null);

    try {
      /* Fix: Create GoogleGenAI instance right before making the API call */
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Extract JIRA tasks from the following pasted text or HTML. 
                  Important: Return ONLY a valid JSON array of tasks. 
                  Available fields: status (Processing, Todo, Done, Suspended), priority (P1, P2, P3), summary (the task name), lastUpdated (ISO date), statusUpdate (recent notes), finishEta (ISO date).
                  Text: ${pastedText}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING },
                status: { type: Type.STRING },
                priority: { type: Type.STRING },
                lastUpdated: { type: Type.STRING },
                statusUpdate: { type: Type.STRING },
                finishEta: { type: Type.STRING },
              },
              required: ["summary", "status", "priority"]
            }
          }
        }
      });

      /* Fix: Access the .text property directly and handle potential undefined value */
      const resultText = response.text;
      if (!resultText) {
        throw new Error("模型未返回任何內容");
      }

      const rawData = JSON.parse(resultText);
      const parsedTasks: Task[] = rawData.map((item: any, i: number) => ({
        id: `ai-task-${Date.now()}-${i}`,
        summary: item.summary,
        status: item.status.includes('处理') || item.status.includes('Processing') ? TaskStatus.Processing : 
                item.status.includes('完成') || item.status.includes('Done') ? TaskStatus.Done : TaskStatus.Todo,
        priority: item.priority as TaskPriority || TaskPriority.P3,
        type: "JIRA Issue",
        lastUpdated: item.lastUpdated ? new Date(item.lastUpdated) : new Date(),
        finishEta: item.finishEta ? new Date(item.finishEta) : new Date(),
        statusUpdate: item.statusUpdate || '',
        reviewDate: extractReviewDate(item.statusUpdate || ''),
        project: getProjectFromSummary(item.summary),
        tags: []
      }));

      onImport(parsedTasks);
    } catch (err) {
      console.error(err);
      setError("AI 解析失敗，請嘗試使用 CSV 導入或檢查貼上內容。");
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex bg-slate-100 p-1 rounded-2xl w-fit mx-auto">
        <button 
          onClick={() => setMode('csv')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${mode === 'csv' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
        >
          <FileType size={16} /> CSV 檔案導入
        </button>
        <button 
          onClick={() => setMode('ai')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${mode === 'ai' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
        >
          <Sparkles size={16} /> AI 智能貼上
        </button>
      </div>

      {mode === 'csv' ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center space-y-6 hover:border-indigo-300 transition-colors">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
            {isParsing ? <Loader2 className="animate-spin" size={32} /> : <Upload size={32} />}
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-800">導入您的 JIRA CSV</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">請從 JIRA 匯出 CSV 檔案後，拖放至此處。</p>
          </div>
          {error && <ErrorMessage message={error} />}
          <div className="flex justify-center gap-4">
            <input type="file" ref={fileInputRef} accept=".csv" onChange={handleFileUpload} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} disabled={isParsing} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2">
              {isParsing ? '解析中...' : '選取 CSV'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                {/* Fix: Changed ClipboardText to Clipboard */}
                <Clipboard size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">智能解析模式</h3>
                <p className="text-xs text-slate-500">在 JIRA 頁面按下 Ctrl+A 全選後複製並貼上到下方</p>
              </div>
            </div>
          </div>
          
          <textarea 
            className="w-full h-64 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono transition-all"
            placeholder="在此處貼上 JIRA 網頁內容..."
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
          />

          {error && <ErrorMessage message={error} />}

          <button 
            onClick={handleAIPaste}
            disabled={isParsing || !pastedText.trim()}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:grayscale"
          >
            {isParsing ? (
              <><Loader2 className="animate-spin" size={20} /> 解析中...</>
            ) : (
              <><Sparkles size={20} /> 執行 AI 智能解析並導入</>
            )}
          </button>
        </div>
      )}

      <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
        <div className="flex items-center gap-2 text-amber-700 font-bold mb-2">
          <Info size={18} />
          <span>為何無法直接輸入網址？</span>
        </div>
        <p className="text-sm text-amber-800 opacity-80 leading-relaxed">
          由於 QNAP JIRA 屬於公司內部系統且受權限保護，外部工具無法直接穿透存取。
          <strong>「智能貼上」</strong>是目前最快且最安全的方式，AI 會自動過濾掉雜訊（選單、側邊欄），只提取任務資料。
        </p>
      </div>
    </div>
  );
};

const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl flex items-start gap-3 text-sm text-left">
    <AlertTriangle className="shrink-0 mt-0.5" size={18} />
    <div>
      <p className="font-bold">發生錯誤</p>
      <p className="opacity-90">{message}</p>
    </div>
  </div>
);
