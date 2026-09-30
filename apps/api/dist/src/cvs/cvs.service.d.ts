import { PrismaService } from '../prisma/prisma.service';
export declare class CvsService {
    private prisma;
    constructor(prisma: PrismaService);
    getMyCvs(studentId: string): Promise<{
        cvs: {
            id: string;
            name: string;
            data: import("@prisma/client/runtime/library").JsonValue;
            is_default: number;
            created: string;
            updated: string;
        }[];
    }>;
    getCvById(studentId: string, cvId: string): Promise<{
        id: string;
        name: string;
        data: import("@prisma/client/runtime/library").JsonValue;
        is_default: number;
        created: string;
        updated: string;
    }>;
    saveCv(studentId: string, cvId: string | null, body: any): Promise<{
        id: string;
    }>;
    deleteCv(studentId: string, cvId: string): Promise<{
        ok: boolean;
    }>;
}
