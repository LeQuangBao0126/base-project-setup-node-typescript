import { TweetRequestBody } from '~/models/requests/Tweet.request'
import databaseService from './database.services'
import Tweet from '~/models/schemas/Tweet.schema'
import HashTag from '~/models/schemas/Hashtag'
import { ObjectId } from 'mongodb'
import { TweetType } from '~/constants/enum'

class TweetService {
  async checkAndCreateHashTags(hashtag: string[]) {
    const hashtags = await Promise.all(
      hashtag.map((hastag) => {
        return databaseService.hashTags.findOneAndUpdate(
          { name: hastag },
          { $setOnInsert: new HashTag({ name: hastag }) },
          { upsert: true, returnDocument: 'after' }
        )
      })
    )
    return hashtags.map((item) => (item.value as any)._id)
  }
  async createTweet(user_id: string, body: TweetRequestBody) {
    const hastags = await this.checkAndCreateHashTags(body.hashtags)

    const rs = await databaseService.tweets.insertOne(
      new Tweet({
        _id: new ObjectId(),
        audience: body.audience,
        content: body.content,
        guest_views: 0,
        user_views: 0,
        hashtags: hastags,
        mentions: body.mentions,
        medias: [],
        parent_id: body.parent_id,
        type: body.type,
        user_id: new ObjectId(user_id),
        created_at: new Date(),
        updated_at: new Date()
      })
    )
    // hoac find lại rs.insertedId
    return body
  }

  async increaseTweet(tweet_id: string, user_id: string) {
    const inc = user_id ? { user_views: 1 } : { guest_views: 1 }
    const result = await databaseService.tweets.findOneAndUpdate(
      { _id: new ObjectId(tweet_id) },
      {
        $inc: inc,
        $currentDate: {
          updated_at: true
        }
      },
      {
        upsert: true,
        returnDocument: 'after',
        projection: {
          guest_views: 1,
          user_views: 1
        }
      }
    )
    return result.value
  }

  async getTweetChildrens({
    tweet_id,
    tweet_type = 2,
    limit = 5,
    page = 1
  }: {
    tweet_id: string
    tweet_type: TweetType
    limit: number
    page: number
  }) {
    const query = await databaseService.tweets
      .aggregate<Tweet>([
        {
          $match: {
            parent_id: new ObjectId(tweet_id),
            type: tweet_type
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
        },
        {
          $skip: (page - 1) * limit
        },
        {
          $limit: limit
        }
      ])
      .toArray()
    const total = await databaseService.tweets.countDocuments()
    const rs = {
      data: [...query],
      pagination: {
        total,
        limit,
        page
      }
    }
    return rs
  }

  async getNewFeeds({ user_id, limit, page }: { user_id: string; limit: number; page: number }) {
    const followed_user_ids = await databaseService.followers
      .find(
        { user_id: new ObjectId(user_id) },
        {
          projection: {
            _id: 0,
            followed_user_id: 1
          }
        }
      )
      .toArray()
    const ids = followed_user_ids.map((item) => item.followed_user_id)
    ids.push(new ObjectId(user_id))
    const tweets = await databaseService.tweets
      .aggregate([
        {
          $match: {
            user_id: {
              $in: ids
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: {
            path: '$user'
          }
        },
        {
          $match: {
            $or: [
              {
                audience: 0
              },
              {
                $and: [
                  {
                    audience: 1
                  },
                  {
                    'user.twitter_cirle': {
                      $in: ids
                    }
                  }
                ]
              }
            ]
          }
        },
        {
          $project: {
            user: {
              password: 0,
              email_verify_token: 0,
              forgot_password_token: 0,
              date_of_birth: 0
            }
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
          $skip: (page - 1) * limit
        },
        {
          $limit: 10
        }
      ])
      .toArray()

    return tweets
  }
}

const tweetService = new TweetService()
export default tweetService
