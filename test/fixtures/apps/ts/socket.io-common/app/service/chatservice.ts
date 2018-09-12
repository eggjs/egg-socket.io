import { Service } from "egg";

declare module 'egg' {
    interface IService {
        chatservice: ChatService;
    }
}
class ChatService extends Service {
    async chatting() {
        return 'from chatting service';
    }
}

export = ChatService;
