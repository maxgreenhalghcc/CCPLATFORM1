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
exports.BarQuizController = void 0;
const common_1 = require("@nestjs/common");
const bar_quiz_service_1 = require("./bar-quiz.service");
const quiz_submit_dto_1 = require("./dto/quiz-submit.dto");
let BarQuizController = class BarQuizController {
    constructor(barQuizService) {
        this.barQuizService = barQuizService;
    }
    getSkin(slug) {
        return this.barQuizService.getSkin(slug);
    }
    submit(slug, dto, request) {
        const requestId = request?.requestId;
        return this.barQuizService.submit(slug, dto, requestId);
    }
};
exports.BarQuizController = BarQuizController;
__decorate([
    (0, common_1.Get)('skin'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BarQuizController.prototype, "getSkin", null);
__decorate([
    (0, common_1.Post)('submit'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, quiz_submit_dto_1.QuizSubmitDto, Object]),
    __metadata("design:returntype", Promise)
], BarQuizController.prototype, "submit", null);
exports.BarQuizController = BarQuizController = __decorate([
    (0, common_1.Controller)('bars/:slug/quiz'),
    __metadata("design:paramtypes", [bar_quiz_service_1.BarQuizService])
], BarQuizController);
//# sourceMappingURL=bar-quiz.controller.js.map