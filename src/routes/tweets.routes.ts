import { Router } from 'express'
import {
  createTweetController,
  getTweetChildrenController,
  getTweetController,
  getNewFeedsController
} from '~/controllers/tweets.controllers'
import {
  audienceValidator,
  createTweetValidator,
  paginationValidator,
  tweetIdValidator
} from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, isUserLoggedInValidator, verifyUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'
const tweetRouter = Router()
tweetRouter.post(
  '/',
  accessTokenValidator,
  verifyUserValidator,
  createTweetValidator,
  wrapRequestHandler(createTweetController)
)
// new Feed cua
// query {limit : number ,page : number , tweet_type : number}
tweetRouter.get(
  '/new-feeds',
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifyUserValidator),
  paginationValidator,
  wrapRequestHandler(getNewFeedsController)
)

tweetRouter.get(
  '/:tweet_id',
  tweetIdValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifyUserValidator),
  isUserLoggedInValidator(audienceValidator),
  wrapRequestHandler(getTweetController)
)

// get tweet children
// query {limit : number ,page : number , tweet_type : number}
tweetRouter.get(
  '/:tweet_id/children',
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifyUserValidator),
  tweetIdValidator,
  audienceValidator,
  wrapRequestHandler(getTweetChildrenController)
)

export default tweetRouter
