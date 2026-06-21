import type { DocumentInfo } from '@/pages/datasets/types';

export enum RunningStatus {
  Unstart = '0',
  Running = '1',
  Cancel = '2',
  Done = '3',
  Fail = '4',
  Schedule = '5',
}

export const parseStatusStateMap: Record<string, string> = {
  [RunningStatus.Unstart]: 'unstart',
  [RunningStatus.Running]: 'running',
  [RunningStatus.Cancel]: 'cancel',
  [RunningStatus.Done]: 'success',
  [RunningStatus.Fail]: 'fail',
  [RunningStatus.Schedule]: 'running',
};

export function isParserRunning(run: string) {
  return run === RunningStatus.Running || run === RunningStatus.Schedule;
}

export function displayChunkMethod(method: string) {
  return method === 'naive' ? 'general' : method;
}

export function progressPercent(progress: number) {
  return Number((Math.max(0, Math.min(1, progress)) * 100).toFixed(2));
}

export function formatDate(value: number | string) {
  const date = new Date(typeof value === 'number' ? value : value);
  if (Number.isNaN(date.getTime())) {
    return String(value || '-');
  }
  return date.toLocaleString();
}

export function formatBytes(size: number) {
  if (!Number.isFinite(size) || size <= 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = size;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

export function getDocumentRunOption(document: DocumentInfo) {
  if (document.run === RunningStatus.Running || document.run === RunningStatus.Schedule) {
    return { run: 2 };
  }

  return {
    run: 1,
    option: document.run === RunningStatus.Done ? { delete: true, apply_kb: false } : undefined,
  };
}
