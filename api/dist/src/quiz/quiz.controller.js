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
exports.QuizController = void 0;
const common_1 = require("@nestjs/common");
const quiz_service_1 = require("./quiz.service");
const create_session_dto_1 = require("./dto/create-session.dto");
const submit_quiz_dto_1 = require("./dto/submit-quiz.dto");
const record_answer_dto_1 = require("./dto/record-answer.dto");
let QuizController = class QuizController {
    constructor(quizService) {
        this.quizService = quizService;
    }
    createSession(slug, dto) {
        return this.quizService.createSession(slug, dto);
    }
    recordAnswer(sessionId, dto) {
        return this.quizService.recordAnswer(sessionId, dto);
    }
    submit(sessionId, dto, req) {
        const requestId = req?.requestId;
        return this.quizService.submit(sessionId, dto, requestId);
    }
};
exports.QuizController = QuizController;
__decorate([
    (0, common_1.Post)('bars/:slug/quiz/sessions'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_session_dto_1.CreateSessionDto]),
    __metadata("design:returntype", void 0)
], QuizController.prototype, "createSession", null);
__decorate([
    (0, common_1.Post)('quiz/sessions/:id/answers'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, record_answer_dto_1.RecordAnswerDto]),
    __metadata("design:returntype", void 0)
], QuizController.prototype, "recordAnswer", null);
__decorate([
    (0, common_1.Post)('quiz/sessions/:id/submit'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, submit_quiz_dto_1.SubmitQuizDto, Object]),
    __metadata("design:returntype", void 0)
], QuizController.prototype, "submit", null);
exports.QuizController = QuizController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [quiz_service_1.QuizService])
], QuizController);
//# sourceMappingURL=quiz.controller.js.map