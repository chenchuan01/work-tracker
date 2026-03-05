export interface WorkRecord {
  id: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  workDate: string;
  isImportant?: boolean;
  tags?: string[];
}

export type TodoStatus = 'pending' | 'in-progress' | 'completed';

export interface Todo {
  id: string;
  content: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  status: TodoStatus;
}

export interface WorkSummary {
  id: string;
  content: string;
  summaryType: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  createdAt: number;
  sourceRecordIds: string[];
}

export type ViewType = 'day' | 'week' | 'month';
export type InputMode = 'record' | 'todo';
