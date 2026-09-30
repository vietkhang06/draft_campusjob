import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(entity: string, entityId: string, action: string, detail: any = {}, actor = 'system') {
    return this.prisma.history.create({
      data: {
        entity,
        entityId,
        action,
        actor,
        detail: detail || {},
      },
    });
  }
}
