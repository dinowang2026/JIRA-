
import React, { useState, useMemo } from 'react';
import { 
  X, 
  Mail, 
  Copy, 
  Check,
  User,
  ExternalLink,
  MessageSquareText,
  AlertCircle,
  Clock,
  BellRing
} from 'lucide-react';
import { Task, TaskStatus } from '../types';
import { isTaskOverdue, isTaskUpcoming, isTaskStale } from '../utils';

interface NotificationCenterProps {
  tasks: Task[];
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ tasks, onClose }) => {
  const [recipient, setRecipient] = useState(() => localStorage.getItem('default_recipient') || '');
  const [copied, setCopied] = useState(false);

  // 僅保留過期的未完成任務
  const overdueTasks = useMemo(() => {
    return tasks.filter(t => isTaskOverdue(t.reviewDate) && t.status !== TaskStatus.Done);
  }, [tasks]);

  const generateEmailBody = () => {
    const today = new Date().toLocaleDateString();
    let body = `Team, 這是今日的 JIRA Review 逾期提醒彙整 (${today}):\n\n`;

    if (overdueTasks.length > 0) {
      body += `⚠️ 【以下任務已過期 - 請儘速處理】\n`;
      body += `------------------------------------------\n`;
      overdueTasks.forEach(t => {
        body += `● [${t.priority}] ${t.summary}\n`;
        body += `  專案: ${t.project}\n`;
        body += `  原定 Review: ${t.reviewDate?.toLocaleDateString() || '未設定'}\n`;
        body += `  最新進度: ${t.statusUpdate || '無描述'}\n\n`;
      });
      body += `------------------------------------------\n`;
    } else {
      body += `✅ 目前所有 Review 任務皆在期限內，無逾期項目。\n`;
    }

    body += `\n請協助前往 JIRA 系統更新最新進度。\n祝 工作順利,\nProjectFlow 系統自動提醒`;
    return body;
  };

  const subject = `【緊急提醒】JIRA 任務逾期彙報 - ${new Date().toLocaleDateString()}`;

  const handleSend = (type: 'mailto' | 'web') => {
    if (!recipient) return alert("請輸入收件人信箱");
    localStorage.setItem('default_recipient', recipient);

    const fullBody = generateEmailBody();
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(fullBody);

    if (type === 'mailto') {
      window.location.href = `mailto:${recipient}?subject=${encodedSubject}&body=${encodedBody}`;
    } else {
      const baseUrl = "https://outlook.office.com/mail/deeplink/compose";
      const baseParams = `?to=${encodeURIComponent(recipient)}&subject=${encodedSubject}`;
      if (baseParams.length + encodedBody.length > 1500) {
        alert("由於任務內容較多，網頁版 Outlook 無法自動填入內文。請點擊『複製全文』按鈕後手動貼上。");
        window.open(`${baseUrl}${baseParams}`, '_blank');
      } else {
        window.open(`${baseUrl}${baseParams}&body=${encodedBody}`, '_blank');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 max-h-[90vh]">
        
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-rose-100">
              <BellRing size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">發送逾期提醒</h2>
              <p className="text-slate-500 text-xs font-bold mt-0.5">系統將僅彙整狀態為「已過期」的未完成任務。</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-2xl text-slate-400 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-6 overflow-hidden flex flex-col">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">收件地址</label>
            <input 
              type="text"
              placeholder="recipient@example.com"
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500/20 focus:bg-white focus:border-rose-500 transition-all font-bold text-sm"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>

          <div className="flex-1 flex flex-col min-h-0 space-y-2">
            <div className="flex justify-between items-end px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <MessageSquareText size={12} /> 郵件預覽 (僅限過期項目)
              </label>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(generateEmailBody());
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  copied ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                }`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? '已複製' : '複製內容'}
              </button>
            </div>
            
            <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6 flex-1 overflow-y-auto custom-scrollbar shadow-inner">
              <pre className="font-sans text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
                {generateEmailBody()}
              </pre>
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => handleSend('mailto')}
            className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-black hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
          >
            <Mail size={20} className="text-slate-400" />
            <span>電腦版發送</span>
          </button>
          <button 
            onClick={() => handleSend('web')}
            className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 flex items-center justify-center gap-2"
          >
            <ExternalLink size={20} />
            <span>網頁版發送</span>
          </button>
        </div>
      </div>
    </div>
  );
};
