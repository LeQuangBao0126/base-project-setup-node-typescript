import { ObjectId } from 'mongodb'
import databaseService from './database.services'

class ConversationService {
  async getConversation({
    sender_id,
    receiver_id,
    limit,
    page
  }: {
    sender_id: string
    receiver_id: string
    limit: number
    page: number
  }) {
    const conversations = await databaseService.conversations
      .find({
        $or: [
          { sender_id: new ObjectId(sender_id), receiver_id: new ObjectId(receiver_id) },
          { sender_id: new ObjectId(receiver_id), receiver_id: new ObjectId(sender_id) }
        ]
      })
      .sort({
        created_at: 1
      })
      .skip(0)
      .limit(3000)
      .toArray()

    const total = await databaseService.conversations.countDocuments({
      $or: [
        { sender_id: new ObjectId(sender_id), receiver_id: new ObjectId(receiver_id) },
        { sender_id: new ObjectId(receiver_id), receiver_id: new ObjectId(sender_id) }
      ]
    })
    return {
      conversations,
      total
    }
  }
}

const conversationServ = new ConversationService()
export default conversationServ
