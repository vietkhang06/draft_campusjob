import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { BranchesService } from './branches.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('employer')
@Controller('branches')
export class BranchesController {
  constructor(private branchesService: BranchesService) {}

  @Get()
  async getBranches(@CurrentUser('id') userId: string) {
    const branches = await this.branchesService.getBranches(userId);
    return { branches };
  }

  @Post()
  async createBranch(
    @CurrentUser('id') userId: string,
    @Body() body: any,
  ) {
    return this.branchesService.saveBranch(userId, null, body);
  }

  @Post(':id')
  async updateBranch(
    @CurrentUser('id') userId: string,
    @Param('id') branchId: string,
    @Body() body: any,
  ) {
    return this.branchesService.saveBranch(userId, branchId, body);
  }

  @Delete(':id')
  async deleteBranch(
    @CurrentUser('id') userId: string,
    @Param('id') branchId: string,
  ) {
    return this.branchesService.deleteBranch(userId, branchId);
  }
}
