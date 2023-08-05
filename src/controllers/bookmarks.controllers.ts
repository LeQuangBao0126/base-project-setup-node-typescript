import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { BookmarkTweetRequestBody } from '~/models/requests/Bookmark.request'
import { TokenPayload } from '~/models/requests/User.requests'
import bookmarkServ from '~/services/bookmark.services'

export const bookmartController = async (
  req: Request<ParamsDictionary, any, BookmarkTweetRequestBody>,
  res: Response
) => {
  const { tweet_id } = req.body
  const user = req.decoded_authorization as TokenPayload
  const rs = await bookmarkServ.bookmarkTweet(user.user_id, tweet_id)
  return res.status(200).json({ message: 'bookmark success', data: rs })
}

export const unBookmarkController = async (
  req: Request<ParamsDictionary, any, BookmarkTweetRequestBody>,
  res: Response
) => {
  const { tweet_id } = req.body
  const user = req.decoded_authorization as TokenPayload
  const rs = await bookmarkServ.unBookmarkTweet(user.user_id, tweet_id)
  return res.status(200).json({ message: 'bookmark success', data: rs })
}
