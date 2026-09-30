import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  async getProfile(@CurrentUser('id') userId: string) {
    const user = await this.usersService.getProfile(userId);
    return { user };
  }

  @Post('profile')
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() body: any,
  ) {
    const user = await this.usersService.updateProfile(userId, body);
    return { ok: true, user };
  }

  @Roles('student')
  @Get('school-verification')
  async getSchoolVerification(@CurrentUser('id') userId: string) {
    return this.usersService.getSchoolVerification(userId);
  }

  @Roles('student')
  @Post('school-verification/send')
  async sendSchoolVerification(
    @CurrentUser('id') userId: string,
    @Body('email') email: string,
  ) {
    return this.usersService.sendSchoolVerificationOtp(userId, email);
  }

  @Roles('student')
  @Post('school-verification/confirm')
  async confirmSchoolVerification(
    @CurrentUser('id') userId: string,
    @Body('code') code: string,
  ) {
    return this.usersService.confirmSchoolVerificationOtp(userId, code);
  }
}
