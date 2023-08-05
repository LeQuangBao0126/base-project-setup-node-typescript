import { TweetAudience, TweetType } from '~/constants/enum'
import { Query } from 'express-serve-static-core'
export interface TweetRequestBody {
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id: null | string
  hashtags: string[] //ten  cua hastag dạng ['javascript','typescript']
  mentions: string[] // user_id []
  medias: string[] // url []
}
export interface Pagination {
  limit: string
  page: string
}

export interface TweetQuery extends Query, Pagination {
  tweet_type: string
}
