"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersModule = void 0;
const common_1 = require("@nestjs/common");
const orders_controller_1 = require("./orders.controller");
const bar_orders_controller_1 = require("./bar-orders.controller");
const orders_service_1 = require("./orders.service");
const api_auth_guard_1 = require("../common/guards/api-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
let OrdersModule = class OrdersModule {
};
exports.OrdersModule = OrdersModule;
exports.OrdersModule = OrdersModule = __decorate([
    (0, common_1.Module)({
        controllers: [orders_controller_1.OrdersController, bar_orders_controller_1.BarOrdersController],
        providers: [orders_service_1.OrdersService, api_auth_guard_1.ApiAuthGuard, roles_guard_1.RolesGuard],
        exports: [orders_service_1.OrdersService]
    })
], OrdersModule);
//# sourceMappingURL=orders.module.js.map