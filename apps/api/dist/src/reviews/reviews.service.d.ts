import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class ReviewsService {
    private prisma;
    private notificationsService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    getCompanyReviews(userId: string): Promise<{
        reviews: {
            id: string;
            rating: number;
            comment: string;
            reply: string;
            hidden: number;
            student_name: string;
            created: string;
        }[];
    }>;
    createReview(studentId: string, body: any): Promise<{
        id: string;
    }>;
    replyReview(employerId: string, reviewId: string, replyText: string): Promise<{
        ok: boolean;
    }>;
}
