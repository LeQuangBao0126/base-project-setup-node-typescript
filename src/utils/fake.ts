import { RegisterRequestBody } from '~/models/requests/User.requests'
import { faker } from '@faker-js/faker'
import { hashPassword } from './crypto'
import { TweetRequestBody } from '~/models/requests/Tweet.request'
import { ObjectId } from 'mongodb'
import { TweetAudience, TweetType, UserVerifyStatus } from '~/constants/enum'
import databaseService from '~/services/database.services'
import User from '~/models/schemas/User.schema'
import Follower from '~/models/schemas/Follower.schema'
import tweetService from '~/services/tweets.services'

const defaultPassword = '123456'
const maxUsers = 100

const my_id = new ObjectId('64b40570cb87275d8481e993') //baobadao

const createRandomUser = () => {
  const user: RegisterRequestBody = {
    name: faker.internet.userName(),
    email: faker.internet.email(),
    password: defaultPassword,
    confirm_password: defaultPassword,
    date_of_birth: faker.date.past().toISOString()
  }
  return user
}

const createRandomTweet = () => {
  const tweet: TweetRequestBody = {
    type: TweetType.Tweet,
    audience: TweetAudience.EveryOne,
    content: faker.lorem.paragraph({ min: 10, max: 160 }),
    hashtags: [],
    mentions: [],
    medias: [],
    parent_id: null
  }
  return tweet
}

const users: RegisterRequestBody[] = faker.helpers.multiple(createRandomUser, {
  count: maxUsers
})

const insertMultipleUser = async (users: RegisterRequestBody[]) => {
  console.log('Creating users .....')
  const rs = await Promise.all(
    users.map(async (user) => {
      const userId = new ObjectId()
      await databaseService.users.insertOne(
        new User({
          ...user,
          username: `user${userId.toString()}`,
          password: hashPassword(user.password),
          date_of_birth: new Date(user.date_of_birth),
          verify: UserVerifyStatus.Verified
        })
      )
      return userId
    })
  )
  console.log(`Created users :: ${rs.length} `)
  return rs
}

const followMultipleUsers = async (user_id: ObjectId, followed_user_ids: ObjectId[]) => {
  console.log('Starting following ...')
  const rs = await Promise.all(
    followed_user_ids.map((followed_user_id) => {
      databaseService.followers.insertOne(
        new Follower({ user_id: new ObjectId(user_id), followed_user_id: new ObjectId(followed_user_id) })
      )
      return
    })
  )
  console.log(`Follow ::: ${followed_user_ids.length} user `)
}

const insertMultipleTweet = async (ids: ObjectId[]) => {
  console.log('Creating multiple tweet ')
  let count = 0
  const result = await Promise.all(
    ids.map(async (uid, index) => {
      //doi de tang 2
      await Promise.all([
        tweetService.createTweet(uid.toString(), createRandomTweet()),
        tweetService.createTweet(uid.toString(), createRandomTweet())
      ])
      count += 2
      console.log(`Created ${count} tweet`)
    })
  )
  return result
}

export const seedingData = () => {
  console.log('start seeding ')
  insertMultipleUser(users).then((uids) => {
    // toi follow .
    followMultipleUsers(my_id, uids)
    insertMultipleTweet(uids)
  })
}
