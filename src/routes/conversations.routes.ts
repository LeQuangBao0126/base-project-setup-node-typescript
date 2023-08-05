import { Router } from "express";
import { getConversationController } from "~/controllers/conversations.controllers";
import { accessTokenValidator } from "~/middlewares/users.middlewares";


const conversationRoutes = Router()


conversationRoutes.get('/receivers/:receiver_id',
                 accessTokenValidator,
                 getConversationController
)

export default conversationRoutes