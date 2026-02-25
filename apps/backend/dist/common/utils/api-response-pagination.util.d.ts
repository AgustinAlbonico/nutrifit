import { IPaginatedData } from '../interfaces/api-response.interface';
export declare class ResponseUtil {
    static createPaginatedData<T>(data: T[], total: number, page: number, limit: number): IPaginatedData<T>;
    static paginated<T>(data: T[], total: number, page: number, limit: number): IPaginatedData<T>;
}
