// Type definitions for @checklogs/node-sdk

export type LogLevel = 'info' | 'warning' | 'error' | 'critical' | 'debug';

export interface LogData {
  message: string;
  level?: LogLevel;
  context?: Record<string, any>;
  source?: string;
  user_id?: number;
}

export interface LogResponse {
  success: boolean;
  status_code: number;
  timestamp: string;
  data: {
    log_id: number;
    application: string;
    level: LogLevel;
    received_at: string;
  };
  message?: string;
}

export interface LogEntry {
  id: number;
  level: LogLevel;
  message: string;
  context: Record<string, any> | null;
  source: string | null;
  ip_address: string;
  user_id: number | null;
  timestamp: string;
}

export interface Pagination {
  limit: number;
  offset: number;
  total: number;
  has_more: boolean;
}

export interface GetLogsOptions {
  limit?: number;
  offset?: number;
  level?: LogLevel;
  since?: string;
  until?: string;
}

export interface GetLogsResponse {
  success: boolean;
  status_code: number;
  timestamp: string;
  data: {
    logs: LogEntry[];
    pagination: Pagination;
    application: {
      id: number;
      name: string;
    };
  };
}

export interface LevelStats {
  level: LogLevel;
  count: number;
}

export interface DailyStat {
  date: string;
  count: number;
}

export interface StatsResponse {
  success: boolean;
  status_code: number;
  timestamp: string;
  data: {
    total_logs: number;
    logs_today: number;
    stats_by_level: LevelStats[];
    daily_stats: DailyStat[];
    application: {
      id: number;
      name: string;
    };
  };
}

export interface TrendAnalysis {
  trend: 'increasing' | 'decreasing' | 'stable' | 'insufficient_data';
  change: number;
  last_week: number;
  previous_week: number;
}

export interface Analytics {
  error_rate: number;
  most_frequent_level: {
    level: LogLevel;
    count: number;
    percentage: number;
  } | null;
  average_logs_per_day: number;
  peak_day: DailyStat | null;
  trend: TrendAnalysis;
}

export interface SummaryResponse extends StatsResponse {
  data: StatsResponse['data'] & {
    analytics: Analytics;
  };
}

export interface ClientOptions {
  timeout?: number;
  validatePayload?: boolean;
}

export interface LoggerOptions extends ClientOptions {
  source?: string;
  user_id?: number;
  defaultContext?: Record<string, any>;
  silent?: boolean;
  consoleOutput?: boolean;
  enabledLevels?: LogLevel[];
  includeTimestamp?: boolean;
  includeHostname?: boolean;
}

export interface RetryQueueItem {
  message: string;
  level: LogLevel;
  retryCount: number;
  addedAt: string;
}

export interface RetryQueueStatus {
  count: number;
  items: RetryQueueItem[];
}

// Error classes
export class CheckLogsError extends Error {
  code: string | null;
  details: any;
  timestamp: string;
  
  constructor(message: string, code?: string | null, details?: any);
  toJSON(): object;
}

export class ValidationError extends CheckLogsError {
  field: string | null;
  
  constructor(message: string, field?: string | null);
}

export class ApiError extends CheckLogsError {
  statusCode: number | null;
  response: any;
  
  constructor(message: string, statusCode?: number | null, errorCode?: string | null, response?: any);
  isAuthError(): boolean;
  isRateLimitError(): boolean;
  isServerError(): boolean;
  isClientError(): boolean;
}

export class NetworkError extends CheckLogsError {
  originalError: Error | null;
  
  constructor(message: string, originalError?: Error | null);
  isTimeoutError(): boolean;
  isConnectionError(): boolean;
}

// Stats class
export class CheckLogsStats {
  constructor(client: CheckLogsClient);
  
  getStats(): Promise<StatsResponse>;
  getStatsByLevel(): Promise<LevelStats[]>;
  getDailyStats(): Promise<DailyStat[]>;
  getTotalLogs(): Promise<number>;
  getLogsToday(): Promise<number>;
  getApplicationInfo(): Promise<{ id: number; name: string }>;
  getErrorRate(): Promise<number>;
  getMostFrequentLevel(): Promise<{ level: LogLevel; count: number; percentage: number } | null>;
  getAverageLogsPerDay(): Promise<number>;
  getPeakDay(): Promise<DailyStat | null>;
  getTrend(): Promise<TrendAnalysis>;
  getSummary(): Promise<SummaryResponse>;
}

// Main client class
export class CheckLogsClient {
  stats: CheckLogsStats;
  
  constructor(apiKey: string, options?: ClientOptions);
  
  log(logData: LogData): Promise<LogResponse>;
  getLogs(options?: GetLogsOptions): Promise<GetLogsResponse>;
  
  // Convenience methods
  info(message: string, context?: Record<string, any>, options?: Partial<LogData>): Promise<LogResponse>;
  warning(message: string, context?: Record<string, any>, options?: Partial<LogData>): Promise<LogResponse>;
  error(message: string, context?: Record<string, any>, options?: Partial<LogData>): Promise<LogResponse>;
  critical(message: string, context?: Record<string, any>, options?: Partial<LogData>): Promise<LogResponse>;
  debug(message: string, context?: Record<string, any>, options?: Partial<LogData>): Promise<LogResponse>;
}

// Logger class
export class CheckLogsLogger extends CheckLogsClient {
  constructor(apiKey: string, options?: LoggerOptions);
  
  child(additionalContext?: Record<string, any>, additionalOptions?: Partial<LoggerOptions>): CheckLogsLogger;
  setEnabledLevels(levels: LogLevel[]): void;
  enableConsole(): void;
  disableConsole(): void;
  enableSilent(): void;
  disableSilent(): void;
  
  time(label: string, message: string, context?: Record<string, any>, level?: LogLevel): () => number;
  flush(timeout?: number): Promise<boolean>;
  getRetryQueueStatus(): RetryQueueStatus;
  clearRetryQueue(): void;
}

// Factory functions
export function createClient(apiKey: string, options?: ClientOptions): CheckLogsClient;
export function createLogger(apiKey: string, options?: LoggerOptions): CheckLogsLogger;

// Default export
declare const _default: typeof createClient;
export default _default;