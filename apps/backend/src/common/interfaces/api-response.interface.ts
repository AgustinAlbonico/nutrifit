export interface IApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T | null;
  error?: any | null;
  errors?: any[];
  meta: any | null;
}
