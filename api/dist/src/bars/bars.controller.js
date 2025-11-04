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
exports.BarsController = void 0;
const common_1 = require("@nestjs/common");
const user_role_enum_1 = require("../common/roles/user-role.enum");
const bars_service_1 = require("./bars.service");
const create_bar_dto_1 = require("./dto/create-bar.dto");
const update_bar_dto_1 = require("./dto/update-bar.dto");
const update_bar_settings_dto_1 = require("./dto/update-bar-settings.dto");
const list_bars_query_dto_1 = require("./dto/list-bars-query.dto");
const api_auth_guard_1 = require("../common/guards/api-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
let BarsController = class BarsController {
    constructor(barsService) {
        this.barsService = barsService;
    }
    findAll(query) {
        return this.barsService.findAll(query);
    }
    create(dto) {
        return this.barsService.create(dto);
    }
    findOne(id) {
        return this.barsService.findOne(id);
    }
    update(id, dto) {
        return this.barsService.update(id, dto);
    }
    findSettings(id) {
        return this.barsService.findSettings(id);
    }
    updateSettings(id, dto) {
        return this.barsService.updateSettings(id, dto);
    }
    createAssetUpload(id) {
        return this.barsService.createAssetUpload(id);
    }
};
exports.BarsController = BarsController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(api_auth_guard_1.ApiAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.admin),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_bars_query_dto_1.ListBarsQueryDto]),
    __metadata("design:returntype", Promise)
], BarsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(api_auth_guard_1.ApiAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.admin),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_bar_dto_1.CreateBarDto]),
    __metadata("design:returntype", Promise)
], BarsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(api_auth_guard_1.ApiAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.admin),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BarsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(api_auth_guard_1.ApiAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.admin),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_bar_dto_1.UpdateBarDto]),
    __metadata("design:returntype", Promise)
], BarsController.prototype, "update", null);
__decorate([
    (0, common_1.Get)(':id/settings'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BarsController.prototype, "findSettings", null);
__decorate([
    (0, common_1.Put)(':id/settings'),
    (0, common_1.UseGuards)(api_auth_guard_1.ApiAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.admin),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_bar_settings_dto_1.UpdateBarSettingsDto]),
    __metadata("design:returntype", Promise)
], BarsController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Post)(':id/assets'),
    (0, common_1.UseGuards)(api_auth_guard_1.ApiAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.admin),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BarsController.prototype, "createAssetUpload", null);
exports.BarsController = BarsController = __decorate([
    (0, common_1.Controller)('bars'),
    __metadata("design:paramtypes", [bars_service_1.BarsService])
], BarsController);
//# sourceMappingURL=bars.controller.js.map