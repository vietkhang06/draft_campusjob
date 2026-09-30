import { CvsService } from './cvs.service';
export declare class CvsController {
    private cvsService;
    constructor(cvsService: CvsService);
    getMyCvs(userId: string): Promise<{
        cvs: {
            id: string;
            name: string;
            data: import("@prisma/client/runtime/library").JsonValue;
            is_default: number;
            created: string;
            updated: string;
        }[];
    }>;
    getCv(userId: string, cvId: string): Promise<{
        id: string;
        name: string;
        data: import("@prisma/client/runtime/library").JsonValue;
        is_default: number;
        created: string;
        updated: string;
    }>;
    createCv(userId: string, body: any): Promise<{
        id: string;
    }>;
    updateCv(userId: string, cvId: string, body: any): Promise<{
        id: string;
    }>;
    deleteCv(userId: string, cvId: string): Promise<{
        ok: boolean;
    }>;
}
