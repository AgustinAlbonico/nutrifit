export interface IApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface IPaginatedData<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
