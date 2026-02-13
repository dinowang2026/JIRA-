
export enum TaskStatus {
  Suspended = 'Suspended',
  Processing = '处理中',
  Todo = '待办',
  Done = '已完成'
}

export enum TaskPriority {
  P1 = 'P1',
  P2 = 'P2',
  P3 = 'P3'
}

export interface Task {
  id: string;
  status: TaskStatus;
  type: string;
  priority: TaskPriority;
  summary: string;
  lastUpdated: Date;
  finishEta: Date;
  statusUpdate: string;
  reviewDate?: Date;
  bossReviewStart?: string;
  tags: string[];
  project: string;
  order?: number; // 用於自訂排序
}

export interface TaskStats {
  total: number;
  overdue: number;
  upcoming: number;
  stale: number;
}
