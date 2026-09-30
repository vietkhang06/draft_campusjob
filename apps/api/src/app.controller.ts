import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { PaymentsService } from './payments/payments.service';
import { OptionalJwtAuthGuard } from './common/guards/optional-jwt-auth.guard';
import { CurrentUser } from './common/decorators/current-user.decorator';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(
    private prisma: PrismaService,
    private paymentsService: PaymentsService,
  ) {}

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get('session')
  async getSession(@CurrentUser() user: any) {
    const adminExists = await this.prisma.user.findFirst({
      where: { role: 'admin' },
      select: { id: true },
    });

    return {
      user: user || null,
      setupRequired: !adminExists,
      emailConfigured: true,
      paymentConfigured: this.paymentsService.isConfigured(),
    };
  }

  @Public()
  @Get('health')
  healthCheck() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
