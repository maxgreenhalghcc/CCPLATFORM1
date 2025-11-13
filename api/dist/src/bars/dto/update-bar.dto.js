"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateBarDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_bar_dto_1 = require("./create-bar.dto");
class UpdateBarDto extends (0, mapped_types_1.PartialType)(create_bar_dto_1.CreateBarDto) {
}
exports.UpdateBarDto = UpdateBarDto;
//# sourceMappingURL=update-bar.dto.js.map