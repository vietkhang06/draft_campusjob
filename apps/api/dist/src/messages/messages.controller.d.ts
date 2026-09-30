import { MessagesService } from './messages.service';
export declare class MessagesController {
    private messagesService;
    constructor(messagesService: MessagesService);
    getMessages(user: any, applicationId: string): Promise<{
        messages: {
            id: string;
            application: string;
            sender: string;
            name: string;
            body: string;
            created: string;
        }[];
    }>;
    sendMessage(user: any, applicationId: string, bodyText: string): Promise<{
        id: string;
    }>;
}
