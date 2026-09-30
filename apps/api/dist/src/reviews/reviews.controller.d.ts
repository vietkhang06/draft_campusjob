import { ReviewsService } from './reviews.service';
export declare class ReviewsController {
    private reviewsService;
    constructor(reviewsService: ReviewsService);
    getMyCompanyReviews(userId: string): Promise<{
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
    createReview(userId: string, body: any): Promise<{
        id: string;
    }>;
    replyReview(userId: string, reviewId: string, replyText: string): Promise<{
        ok: boolean;
    }>;
}
