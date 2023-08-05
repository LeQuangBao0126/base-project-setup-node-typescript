import User from '~/models/schemas/User.schema'
import databaseService from './database.services'
import { RegisterRequestBody, UpdateMeReqBody } from '~/models/requests/User.requests'
import { hashPassword } from '~/utils/crypto'
import { signToken, verifyToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enum'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { ObjectId } from 'mongodb'
import { ErrorWithStatus } from '~/models/Error'
import Follower from '~/models/schemas/Follower.schema'
import { sendVerifyEmailTemplate } from '~/utils/email'

class UsersService {
  private signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, verify, tokenType: TokenType.AccessToken },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
      option: { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN }
    })
  }

  private signRefreshToken({ user_id, verify, exp }: { user_id: string; verify: UserVerifyStatus; exp?: number }) {
    if (exp) {
      // neu có thời điểm thì dùng thời điểm
      return signToken({
        payload: { user_id, verify, tokenType: TokenType.RefreshToken, exp },
        privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
        //option: { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN } nếu có exp rồi thì ko expireIn nữa .
      })
    }
    return signToken({
      payload: { user_id, verify, tokenType: TokenType.RefreshToken },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      option: { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN }
    })
  }

  private signEmailVerifyToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, verify, tokenType: TokenType.EmailVerifyToken },
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
      option: { expiresIn: process.env.EMAIL_TOKEN_EXPIRES_IN }
    })
  }

  private signForgotPasswordToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, verify, tokenType: TokenType.ForgotPasswordToken },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
      option: { expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN }
    })
  }

  private signAccessAndRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshToken({ user_id, verify })])
  }

  private async decodeRefreshToken(refresh_token: string) {
    return await verifyToken({
      token: refresh_token,
      secretOrPublicKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
    })
  }

  // gui email cho khach khi dang ki thanh cong
  async register(payload: RegisterRequestBody) {
    try {
      const user_id = new ObjectId().toString()
      const email_verify_token = await this.signEmailVerifyToken({ user_id, verify: UserVerifyStatus.Unverified })

      await databaseService.users.insertOne(
        new User({
          ...payload,
          _id: new ObjectId(user_id),
          username: `user${user_id}`,
          date_of_birth: new Date(payload.date_of_birth),
          password: hashPassword(payload.password),
          email_verify_token: email_verify_token
        })
      )

      const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
        user_id,
        verify: UserVerifyStatus.Unverified
      })

      const decode_refresh_token = await this.decodeRefreshToken(refresh_token)

      await databaseService.refreshTokens.insertOne(
        new RefreshToken({
          token: refresh_token as string,
          user_id: new ObjectId(user_id),
          created_at: new Date(),
          iat: decode_refresh_token!.iat,
          exp: decode_refresh_token!.exp
        })
      )
      // flow gửi mail
      // 1 sever send email to user
      // 2 user click link in email
      // 3 Client send request to server with email_verify_token
      // 4  Server verify email_verify_token
      // 5 client receive access_token , refresh_token

      sendVerifyEmailTemplate('nhoctengi6789@gmail.com', email_verify_token)

      return {
        access_token,
        refresh_token
      }
    } catch (err: any) {
      throw new Error(err)
    }
  }

  async refreshToken({
    user_id,
    verify,
    refresh_token,
    exp
  }: {
    user_id: string
    verify: UserVerifyStatus
    refresh_token: string
    exp: number
  }) {
    const [access_token, new_refresh_token] = await Promise.all([
      this.signAccessToken({ user_id, verify }),
      this.signRefreshToken({ user_id, verify, exp })
    ])
    const deleteRs = await databaseService.refreshTokens.deleteOne({ token: refresh_token })

    const decode_refresh_token = await this.decodeRefreshToken(new_refresh_token)
    //xoa cai cu va insert cai moi
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: new_refresh_token as string,
        user_id: new ObjectId(user_id),
        created_at: new Date(),
        iat: decode_refresh_token!.iat,
        exp: decode_refresh_token!.exp
      })
    )
    return {
      access_token,
      refresh_token: new_refresh_token
    }
  }

  async checkEmailExisting(value: string) {
    const user = await databaseService.users.findOne({ email: value })
    return Boolean(user)
  }

  async login(user_id: string, verify: UserVerifyStatus) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({ user_id, verify })

    const decode_refresh_token = await this.decodeRefreshToken(refresh_token)

    databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token as string,
        user_id: new ObjectId(user_id),
        created_at: new Date(),
        iat: decode_refresh_token!.iat,
        exp: decode_refresh_token!.exp
      })
    )
    return {
      access_token,
      refresh_token
    }
  }

  async logout(refresh_token: string) {
    await databaseService.refreshTokens.deleteOne({ token: refresh_token })
  }

  async verifyEmail({ user_id }: { user_id: string }) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id,
      verify: UserVerifyStatus.Verified
    })
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          verify: UserVerifyStatus.Verified,
          email_verify_token: '',
          updated_at: '$$NOW'
        }
      }
    ])

    return {
      access_token,
      refresh_token
    }
  }

  async resendVerifyEmail(user_id: string) {
    const email_verify_token = await this.signEmailVerifyToken({ user_id, verify: UserVerifyStatus.Unverified })
    // gui mail
    //cap nhat lai user
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          email_verify_token,
          updated_at: '$$NOW'
        }
      }
    ])
    sendVerifyEmailTemplate('nhoctengi6789@gmail.com', email_verify_token)
  }

  async forgotPassword({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const forgotPasswordToken = await this.signForgotPasswordToken({ user_id, verify })
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          forgot_password_token: forgotPasswordToken,
          updated_at: new Date()
        }
      }
    )

    // gửi email kèm link đến ng dùng . https://abc.com/forgot-password?token=eyasdasdkahdksahdakdjhsa
    // khi click thì sẽ verify_forgot_password còn hạn ko , đúng ko . mới được chuyển đến trang verify_forgot_password
    //console.log('forgot_password_token', forgotPasswordToken)
    return { message: 'thanh cong roi ban .Xin hãy kiếm tra email' }
  }

  async resetPassword(user_id: string, password: string) {
    const result = await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          forgot_password_token: '',
          password: hashPassword(password)
        },
        $currentDate: {
          created_at: true
        }
      }
    )
    console.log(result)
    return {
      message: 'Reset password success . please login again'
    }
  }

  async getMe(user_id: string) {
    const user = await databaseService.users.findOne(
      { _id: new ObjectId(user_id) },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
          created_at: 0,
          updated_at: 0
        }
      }
    )
    return user
  }

  async updateMe(user_id: string, payload: UpdateMeReqBody) {
    // allow fields update
    const p = payload.date_of_birth
      ? { ...payload, date_of_birth: new Date(payload.date_of_birth) }
      : { ...payload, date_of_birth: undefined }
    const doc = await databaseService.users.findOneAndUpdate(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          ...p
        },
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: 'after',
        projection: {
          created_at: 0,
          updated_at: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
          password: 0
        }
      }
    )
    return doc.value
  }

  async getProfile(username: string) {
    const data = await databaseService.users.findOne(
      { username },
      {
        projection: {
          password: 0
        }
      }
    )
    if (data === null) {
      throw new ErrorWithStatus({ message: 'ko tim thay user', status: 404 })
    }
    return data
  }

  async follow(user_id: string, followed_user_id: string) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    if (follower) {
      return { message: 'user is already following' }
    }
    const rs = await databaseService.followers.insertOne(
      new Follower({ user_id: new ObjectId(user_id), followed_user_id: new ObjectId(followed_user_id) })
    )
    if (rs.insertedId.toString() !== '') {
      return { message: 'follow success' }
    }
    return { message: 'follow failed' }
  }

  async unFollow(user_id: string, followed_user_id: string) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    console.log(follower)
    if (follower === null) {
      return { message: 'already unfollowed' }
    }
    const deleted = await databaseService.followers.deleteOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    if (deleted.deletedCount > -1) {
      return { message: 'unfollow success' }
    }
    return { message: 'unfollow failed' }
  }
}

const usersService = new UsersService()
export default usersService
