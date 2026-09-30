import { BranchesService } from './branches.service';
export declare class BranchesController {
    private branchesService;
    constructor(branchesService: BranchesService);
    getBranches(userId: string): Promise<{
        branches: {
            id: string;
            name: string;
            address: string;
            companyId: string;
            city: string;
            lat: number | null;
            lng: number | null;
        }[];
    }>;
    createBranch(userId: string, body: any): Promise<{
        id: string;
    }>;
    updateBranch(userId: string, branchId: string, body: any): Promise<{
        id: string;
    }>;
    deleteBranch(userId: string, branchId: string): Promise<{
        ok: boolean;
    }>;
}
