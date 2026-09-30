import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  Headers,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get('plans')
  async getPlans(@CurrentUser() user: any) {
    return this.paymentsService.getPlans(user?.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('plans')
  async createPlan(
    @CurrentUser('id') adminId: string,
    @Body() body: any,
  ) {
    return this.paymentsService.createPlan(adminId, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('plans/:id')
  async togglePlan(
    @CurrentUser('id') adminId: string,
    @Param('id') planId: string,
    @Body('active') active: boolean,
  ) {
    return this.paymentsService.togglePlan(adminId, planId, active);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('employer')
  @Get('orders')
  async getOrders(@CurrentUser('id') userId: string) {
    return this.paymentsService.getOrders(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('employer')
  @Post('orders')
  async createOrder(
    @CurrentUser('id') userId: string,
    @CurrentUser('email') userEmail: string,
    @Body() body: any,
  ) {
    return this.paymentsService.createOrder(userId, userEmail, body);
  }

  @Public()
  @Post('payment-webhook')
  async paymentWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Thiếu chữ ký thanh toán.');
    }
    const rawBody = (req as any).rawBody || req.body;
    return this.paymentsService.handleWebhook(rawBody, signature);
  }
}
