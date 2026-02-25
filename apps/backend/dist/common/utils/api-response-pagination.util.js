"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseUtil = void 0;
class ResponseUtil {
    static createPaginatedData(data, total, page, limit) {
        const totalPages = Math.ceil(total / limit);
        const paginatedData = {
            items: data,
            pagination: {
                total,
                page,
                limit,
                totalPages,
                hasNext: page * limit < total,
                hasPrev: page > 1,
            },
        };
        return paginatedData;
    }
    static paginated(data, total, page, limit) {
        const paginatedData = this.createPaginatedData(data, total, page, limit);
        return paginatedData;
    }
}
exports.ResponseUtil = ResponseUtil;
//# sourceMappingURL=api-response-pagination.util.js.map