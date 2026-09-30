import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { CvsService } from './cvs.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('student')
@Controller('cvs')
export class CvsController {
  constructor(private cvsService: CvsService) {}

  @Get()
  async getMyCvs(@CurrentUser('id') userId: string) {
    return this.cvsService.getMyCvs(userId);
  }

  @Get(':id')
  async getCv(
    @CurrentUser('id') userId: string,
    @Param('id') cvId: string,
  ) {
    return this.cvsService.getCvById(userId, cvId);
  }

  @Post()
  async createCv(
    @CurrentUser('id') userId: string,
    @Body() body: any,
  ) {
    return this.cvsService.saveCv(userId, null, body);
  }

  @Post(':id')
  async updateCv(
    @CurrentUser('id') userId: string,
    @Param('id') cvId: string,
    @Body() body: any,
  ) {
    return this.cvsService.saveCv(userId, cvId, body);
  }

  @Delete(':id')
  async deleteCv(
    @CurrentUser('id') userId: string,
    @Param('id') cvId: string,
  ) {
    return this.cvsService.deleteCv(userId, cvId);
  }
}
