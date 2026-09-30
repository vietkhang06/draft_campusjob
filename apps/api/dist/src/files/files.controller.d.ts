import { Response } from 'express';
import { FilesService } from './files.service';
export declare class FilesController {
    private filesService;
    constructor(filesService: FilesService);
    uploadFile(userId: string, file: Express.Multer.File, purpose: string): Promise<{
        id: string;
        name: string;
    }>;
    downloadFile(userId: string, userRole: string, fileId: string, res: Response): Promise<void>;
    deleteFile(userId: string, userRole: string, fileId: string): Promise<{
        ok: boolean;
        message: string;
    }>;
}
