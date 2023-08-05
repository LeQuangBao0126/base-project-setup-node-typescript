import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { TokenPayload } from '~/models/requests/User.requests'
import conversationServ from '~/services/conversation.services'

export const getConversationController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const user = req.decoded_authorization as TokenPayload
  const { receiver_id } = req.params
  const { limit, page } = req.query

  const rs = await conversationServ.getConversation({
    sender_id: user.user_id as string,
    receiver_id,
    limit: Number(limit || 10),
    page: Number(page || 1)
  })
  return res.status(200).json({
    message: 'get conversation success',
    result: {
      limit,
      page,
      conversations: rs.conversations,
      total: rs.total
    }
  })
}
