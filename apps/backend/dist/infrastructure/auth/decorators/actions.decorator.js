"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Actions = exports.ACTIONS_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.ACTIONS_KEY = 'actions';
const Actions = (...actions) => (0, common_1.SetMetadata)(exports.ACTIONS_KEY, actions);
exports.Actions = Actions;
//# sourceMappingURL=actions.decorator.js.map