import { CompaniesService } from './companies.service';
export declare class CompaniesController {
    private companiesService;
    constructor(companiesService: CompaniesService);
    getCompanies(q?: string): Promise<{
        companies: {
            open_jobs: number;
            rating: number;
            id: string;
            createdAt: Date;
            name: string;
            email: string;
            status: string;
            updatedAt: Date;
            ownerId: string;
            tax: string;
            address: string;
            phone: string;
            website: string | null;
            industry: string;
            size: string;
            hr: string;
            description: string;
            license: string | null;
            reason: string | null;
            flag: number;
        }[];
    }>;
    getCompany(id: string): Promise<{
        company: {
            id: string;
            name: string;
            address: string;
            website: string;
            industry: string;
            size: string;
            description: string;
            status: string;
            flag: number;
            created: string;
            branches: {
                id: string;
                name: string;
                address: string;
                companyId: string;
                city: string;
                lat: number | null;
                lng: number | null;
            }[];
            reviews: {
                id: string;
                rating: number;
                comment: string;
                reply: string;
                created: string;
                student_name: string;
            }[];
            rating: number;
        };
    }>;
    getMyCompany(userId: string): Promise<{
        company: {
            id: string;
            createdAt: Date;
            name: string;
            email: string;
            status: string;
            updatedAt: Date;
            ownerId: string;
            tax: string;
            address: string;
            phone: string;
            website: string | null;
            industry: string;
            size: string;
            hr: string;
            description: string;
            license: string | null;
            reason: string | null;
            flag: number;
        };
    }>;
    saveMyCompany(userId: string, body: any): Promise<{
        id: any;
    }>;
}
