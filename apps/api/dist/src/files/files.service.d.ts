import { Readable } from 'stream';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
export declare class FilesService {
    private readonly prisma;
    private readonly storageService;
    private readonly logger;
    constructor(prisma: PrismaService, storageService: StorageService);
    upload(userId: string, file: Express.Multer.File, purpose: string): Promise<{
        id: string;
        name: string;
    }>;
    getFileStream(userId: string, userRole: string, fileId: string): Promise<{
        stream: Readable;
        file: {
            id: string;
            createdAt: Date;
            name: string;
            ownerId: string;
            size: number;
            mime: string;
            purpose: string;
        };
    }>;
    deleteFile(userId: string, userRole: string, fileId: string): Promise<{
        ok: boolean;
        message: string;
    }>;
    checkOwnership(fileId: string, userId: string, purpose?: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        ownerId: string;
        size: number;
        mime: string;
        purpose: string;
    }>;
}
