"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BarsModule = void 0;
const common_1 = require("@nestjs/common");
const bars_controller_1 = require("./bars.controller");
const bars_service_1 = require("./bars.service");
const bar_quiz_controller_1 = require("./bar-quiz.controller");
const bar_quiz_service_1 = require("./bar-quiz.service");
const orders_module_1 = require("../orders/orders.module");
const recipes_module_1 = require("../recipes/recipes.module");
let BarsModule = class BarsModule {
};
exports.BarsModule = BarsModule;
exports.BarsModule = BarsModule = __decorate([
    (0, common_1.Module)({
        imports: [orders_module_1.OrdersModule, recipes_module_1.RecipesModule],
        controllers: [bars_controller_1.BarsController, bar_quiz_controller_1.BarQuizController],
        providers: [bars_service_1.BarsService, bar_quiz_service_1.BarQuizService],
        exports: [bars_service_1.BarsService],
    })
], BarsModule);
//# sourceMappingURL=bars.module.js.map