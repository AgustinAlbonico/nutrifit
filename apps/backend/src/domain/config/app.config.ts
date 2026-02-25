export interface AppConfig {
  getPort(): number;
  getNodeEnv(): 'production' | 'test' | 'dev';
  getAppName(): string;
}
