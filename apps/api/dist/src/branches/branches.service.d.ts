import { PrismaService } from '../prisma/prisma.service';
export declare class BranchesService {
    private prisma;
    constructor(prisma: PrismaService);
    getBranches(userId: string): Promise<{
        id: string;
        name: string;
        address: string;
        companyId: string;
        city: string;
        lat: number | null;
        lng: number | null;
    }[]>;
    saveBranch(userId: string, branchId: string | null, data: any): Promise<{
        id: string;
    }>;
    deleteBranch(userId: string, branchId: string): Promise<{
        ok: boolean;
    }>;
}
