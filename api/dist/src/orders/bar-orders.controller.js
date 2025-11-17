"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BarOrdersController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const orders_service_1 = require("./orders.service");
const api_auth_guard_1 = require("../common/guards/api-auth.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const roles_guard_1 = require("../common/guards/roles.guard");
const client_2 = require("@prisma/client");
let BarOrdersController = class BarOrdersController {
    constructor(ordersService) {
        this.ordersService = ordersService;
        this.allowedStatuses = new Set(Object.values(client_1.OrderStatus));
    }
    listForBar(id, status, request) {
        let normalized;
        if (status) {
            const lowered = status.toLowerCase();
            if (!this.allowedStatuses.has(lowered)) {
                throw new common_1.BadRequestException('Invalid status filter');
            }
            normalized = lowered;
        }
        return this.ordersService.listForBar(id, normalized, request.user);
    }
};
exports.BarOrdersController = BarOrdersController;
__decorate([
    (0, common_1.Get)(':id/orders'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], BarOrdersController.prototype, "listForBar", null);
exports.BarOrdersController = BarOrdersController = __decorate([
    (0, common_1.UseGuards)(api_auth_guard_1.ApiAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_2.UserRole.admin, client_2.UserRole.staff),
    (0, common_1.Controller)('bars'),
    __metadata("design:paramtypes", [orders_service_1.OrdersService])
], BarOrdersController);
//# sourceMappingURL=bar-orders.controller.js.map