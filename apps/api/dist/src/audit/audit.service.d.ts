import { PrismaService } from '../prisma/prisma.service';
export declare class AuditService {
    private prisma;
    constructor(prisma: PrismaService);
    log(entity: string, entityId: string, action: string, detail?: any, actor?: string): Promise<{
        id: string;
        createdAt: Date;
        entity: string;
        entityId: string;
        action: string;
        actor: string;
        detail: import("@prisma/client/runtime/library").JsonValue;
    }>;
}
