import { NextFunction, Request, Response } from 'express'
import { TokenPayload } from '~/models/requests/User.requests'
import { ParamsDictionary } from 'express-serve-static-core'
import { TweetQuery, TweetRequestBody } from '~/models/requests/Tweet.request'
import tweetService from '~/services/tweets.services'
import { TweetType } from '~/constants/enum'
import Tweet from '~/models/schemas/Tweet.schema'

export const createTweetController = async (
  req: Request<ParamsDictionary, any, TweetRequestBody>,
  res: Response,
  next: NextFunction
) => {
  const user = req.decoded_authorization as TokenPayload
  const rs = await tweetService.createTweet(user.user_id, req.body)
  return res.json({ message: 'Lụm', data: rs })
}

export const getTweetController = async (req: Request<ParamsDictionary>, res: Response) => {
  const rs = await tweetService.increaseTweet(
    req.params.tweet_id,
    req.decoded_authorization?.user_id.toString() as string
  )
  const tweet = {
    ...req.tweet,
    user_views: rs?.user_views,
    guest_views: rs?.guest_views
  } as Tweet

  return res.json({ data: tweet })
}

export const getTweetChildrenController = async (req: Request<ParamsDictionary>, res: Response) => {
  const _id = req.tweet!._id
  const { limit, page } = req.query

  const rs = await tweetService.getTweetChildrens({
    tweet_id: _id?.toString() as string,
    tweet_type: TweetType.Comment,
    limit: limit ? +limit : 5,
    page: page ? +page : 1
  })
  return res.json({ message: 'Lấy 1 tweet thành công', data: rs })
}

export const getNewFeedsController = async (
  req: Request<any, any, any, TweetQuery>,
  res: Response,
  next: NextFunction
) => {
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const { user_id } = req.decoded_authorization as TokenPayload

  const rs = await tweetService.getNewFeeds({ user_id, limit, page })
  return res.json({ message: 'Lấy 1 tweet thành công', data: rs })
}
