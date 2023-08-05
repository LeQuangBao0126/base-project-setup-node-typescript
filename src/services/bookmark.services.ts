import Bookmark from '~/models/schemas/Bookmark.schemas'
import databaseService from './database.services'
import { ObjectId } from 'mongodb'
import { ErrorWithStatus } from '~/models/Error'

class BookmarkService {
  async bookmarkTweet(user_id: string, tweet_id: string) {
    if (!ObjectId.isValid(tweet_id)) {
      throw new ErrorWithStatus({ message: 'invalid tweet', status: 400 })
    }
    const rs = await databaseService.bookmarks.findOneAndUpdate(
      { user_id: new ObjectId(user_id), tweet_id: new ObjectId(tweet_id) },
      { $setOnInsert: new Bookmark({ user_id: new ObjectId(user_id), tweet_id: new ObjectId(tweet_id) }) },
      { upsert: true, returnDocument: 'after' }
    )
    console.log(rs)
    return rs
  }
  async unBookmarkTweet(user_id: string, tweet_id: string) {
    const rs = await databaseService.bookmarks.findOneAndDelete({
      user_id: new ObjectId(user_id),
      tweet_id: new ObjectId(tweet_id)
    })
    return rs
  }
}

const bookmarkServ = new BookmarkService()
export default bookmarkServ
