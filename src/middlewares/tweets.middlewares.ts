import { NextFunction, Request, Response } from 'express'
import { checkSchema } from 'express-validator'
import { isEmpty } from 'lodash'
import { ObjectId } from 'mongodb'
import { MediaType, TweetAudience, TweetType, UserVerifyStatus } from '~/constants/enum'
import { TWEET_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Error'
import Tweet from '~/models/schemas/Tweet.schema'
import databaseService from '~/services/database.services'
import { numberEnumToArray } from '~/utils/commons'
import { wrapRequestHandler } from '~/utils/handlers'
import { validate } from '~/utils/validation'

const tweetTypes = numberEnumToArray(TweetType)
const tweetAudiences = numberEnumToArray(TweetAudience)
const mediaTypes = numberEnumToArray(MediaType)

export const createTweetValidator = validate(
  checkSchema(
    {
      type: {
        custom: {
          options: (value, { req }) => {
            if (!tweetTypes.includes(value)) {
              throw new Error(TWEET_MESSAGES.INVALID_TYPE)
            }
            return true
          }
        },
        errorMessage: TWEET_MESSAGES.INVALID_TYPE
      },
      audience: {
        custom: {
          options: (value, { req }) => {
            if (!tweetAudiences.includes(value)) {
              throw new Error(TWEET_MESSAGES.INVALID_TYPE)
            }
            return true
          }
        },
        errorMessage: TWEET_MESSAGES.INVALID_AUDIENCE
      },
      parent_id: {
        custom: {
          options: async (value, { req }) => {
            const type = req.body.type as TweetType
            // Nếu type là retweet , comment , quoteTweet thì parent_id phải là ObjectId của cha
            if (
              [TweetType.Comment, TweetType.ReTweet, TweetType.QuoteTweet].includes(type) &&
              !ObjectId.isValid(value)
            ) {
              throw new Error(TWEET_MESSAGES.PARENT_ID_MUST_BE_A_VALID_TWEET_ID)
            }

            //  tweet bình thường .
            if (type === TweetType.Tweet && value !== null) {
              throw new Error('parent id must be null')
            }
            return true
          }
        }
      },
      content: {
        isString: true,
        custom: {
          options: (value, { req }) => {
            const type = req.body.type as TweetType
            const hashtags = req.body.hashtags as string[]
            const mentions = req.body.mentions as string[]

            if (
              ![TweetType.Comment, TweetType.ReTweet, TweetType.QuoteTweet].includes(type) &&
              isEmpty(hashtags) &&
              isEmpty(mentions) &&
              value === ''
            ) {
              throw new Error(TWEET_MESSAGES.CONTENT_MUST_BE_NON_EMPTY_STRING)
            }
            return true
          }
        }
      },
      hashtags: {
        isArray: true,
        custom: {
          options: (value: string[], { req }) => {
            // yeu cầu mỗi phần tử trong mảng là string
            if (!value.every((item) => typeof item === 'string')) {
              throw new Error('every items in hashtags must be character letter')
            }
            return true
          }
        }
      },
      mentions: {
        isArray: true,
        custom: {
          options: (value: string[], { req }) => {
            // yeu cầu mỗi phần tử trong mảng là string
            if (value.some((item: any) => !ObjectId.isValid(item))) {
              throw new Error('mentions must be array of user_id')
            }
            return true
          }
        }
      },
      medias: {
        isArray: true,
        custom: {
          options: (value: string[], { req }) => {
            if (
              value.some((item: any) => {
                return typeof item.url !== 'string' || !mediaTypes.includes(item)
              })
            ) {
              throw new Error('medias  must be array of medias Ojbect')
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)
export const tweetIdValidator = validate(
  checkSchema(
    {
      tweet_id: {
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new Error('tweet id is not valid ')
            }
            const query = await databaseService.tweets
              .aggregate<Tweet>([
                {
                  $match: {
                    _id: new ObjectId(value)
                  }
                },
                {
                  $lookup: {
                    from: 'hashtags',
                    localField: 'hashtags',
                    foreignField: '_id',
                    as: 'hashtags'
                  }
                },
                {
                  $lookup: {
                    from: 'users',
                    localField: 'mentions',
                    foreignField: '_id',
                    as: 'mentions'
                  }
                },
                {
                  $lookup: {
                    from: 'bookmarks',
                    localField: '_id',
                    foreignField: 'tweet_id',
                    as: 'bookmarks'
                  }
                },
                {
                  $addFields: {
                    bookmark_count: {
                      $size: '$bookmarks'
                    }
                  }
                }
              ])
              .toArray()
            const tweet = query[0]

            if (!tweet) {
              throw new Error('tweet is not found')
            }
            ;(req as Request).tweet = tweet
            return true
          }
        }
      }
    },
    ['params', 'body']
  )
)
export const audienceValidator = wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
  const tweet = req.tweet as Tweet
  if (tweet.audience === TweetAudience.TwitterCirle) {
    // kiem tra user xem tweet này có đang nhap ko
    // neu ko  thì ko dc xem trong cirle này
    // neu co thì dc xem
    if (!req.decoded_authorization) {
      throw new ErrorWithStatus({ message: 'access token is required', status: 200 })
    }
    // kiem tra
    const { user_id } = req.decoded_authorization

    const author = await databaseService.users.findOne({ _id: new ObjectId(tweet.user_id) })

    if (!author || author.verify === UserVerifyStatus.Banned) {
      throw new ErrorWithStatus({ message: 'author is not found or banned', status: 404 })
    }
    const isInTwitterCirle = author.twitter_cirle.some((userCircleId) => userCircleId.equals(user_id))

    if (!author._id.equals(user_id) && !isInTwitterCirle) {
      //neu ko trong cirle hoac ko phải tác giả thì ko cho xem
      throw new ErrorWithStatus({ message: 'tweer is not public', status: 403 })
    }

    next()
  }
})

export const paginationValidator = validate(
  checkSchema(
    {
      limit: {
        isNumeric: true,
        custom: {
          options: async (value) => {
            const limit = Number(value)
            if (limit < 1) {
              throw Error('limit >= 1 ')
            }
            return true
          }
        }
      },
      page: {
        isNumeric: true,
        custom: {
          options: async (value) => {
            const page = Number(value)
            if (page < 1) {
              throw Error('page >= 1 ')
            }
            return true
          }
        }
      }
    },

    ['query']
  )
)
