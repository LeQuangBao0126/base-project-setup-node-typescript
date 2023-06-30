import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import usersService from '~/services/users.services'
import {
  FollowReqBody,
  ForgotPasswordRequestBody,
  LoginRequestBody,
  RegisterRequestBody,
  ResetPasswordRequestBody,
  TokenPayload,
  UpdateMeReqBody
} from '~/models/requests/User.requests'
import databaseService from '~/services/database.services'

import HTTP_STATUS from '~/constants/httpStatus'
import { USER_MESSAGES } from '~/constants/messages'
import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '~/constants/enum'
import User from '~/models/schemas/User.schema'

export const loginController = async (req: Request<ParamsDictionary, any, LoginRequestBody>, res: Response) => {
  const user = req.user
  if (user) {
    const result = await usersService.login(user._id?.toString() as string, user.verify)

    return res.status(200).send({ message: 'Login success', result })
  }
}
export const registerController = async (req: Request<ParamsDictionary, any, RegisterRequestBody>, res: Response) => {
  const result = await usersService.register(req.body)
  return res.status(200).json({ message: 'register success', result })
}

export const logoutController = async (req: Request, res: Response) => {
  const { refresh_token } = req.body
  const result = await usersService.logout(refresh_token)
  return res.status(200).json({ message: 'logout success', result })
}
export const verifyEmailController = async (req: Request, res: Response) => {
  const payload = req.decoded_email_verify_token
  const user = await databaseService.users.findOne({ _id: new ObjectId(payload?.user_id as string) })
  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({ message: USER_MESSAGES.USER_NOT_FOUND })
  }
  if (user.email_verify_token === '') {
    return res.status(HTTP_STATUS.OK).json({ message: 'user đã được verify rồi . xin hãy kiemtra lại' })
  }

  const result = await usersService.verifyEmail({
    user_id: payload?.user_id as string
  })
  return res.status(HTTP_STATUS.OK).json({ message: 'verify thành công', result })
}

export const resendVerifyEmailController = async (req: Request, res: Response) => {
  const { user_id, verify } = req.decoded_authorization as TokenPayload
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'ko tim thay user' })
  }

  if (user.verify === UserVerifyStatus.Verified) {
    return res.status(HTTP_STATUS.OK).json({ message: 'user đã verify' })
  }
  //gui mail
  await usersService.resendVerifyEmail(user_id)
  return res.status(200).json({ message: 'resend verify email success' })
}

export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordRequestBody>,
  res: Response
) => {
  const { _id, verify } = req.user as User
  const result = await usersService.forgotPassword({ user_id: _id?.toString() as string, verify })
  res.status(HTTP_STATUS.OK).json({ message: 'send forgot password success ', result })
}

export const verifyForgotPasswordController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  return res.status(HTTP_STATUS.OK).json({ message: 'send forgot password success ' })
}

export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordRequestBody>,
  res: Response
) => {
  const { userId } = req.decoded_forgot_password_token as TokenPayload
  const { password } = req.body
  const result = await usersService.resetPassword(userId, password)
  return res.json(result)
}

export const getMeController = async (req: Request, res: Response) => {
  const q = req.decoded_authorization as TokenPayload
  const result = await usersService.getMe(q.user_id)
  return res.json({ message: 'Lụm', result })
}

export const updateMeController = async (req: Request<ParamsDictionary, any, UpdateMeReqBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { body } = req
  console.log(body)
  const user = await usersService.updateMe(user_id, body)

  return res.json({ message: 'Lụm update me ', result: user })
}

export const getProfileController = async (req: Request<{ username: string }>, res: Response) => {
  const { username } = req.params
  const profile = await usersService.getProfile(username)
  return res.status(200).json({ result: profile })
}

// follow
export const followController = async (req: Request<ParamsDictionary, any, FollowReqBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { follow_user_id } = req.body
  const rs = await usersService.follow(user_id, follow_user_id)
  return res.status(200).json(rs)
}

export const unFollowController = async (req: Request<{ follow_user_id: string }>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { follow_user_id } = req.params
  const rs = await usersService.unFollow(user_id, follow_user_id)
  return res.status(200).json(rs)
}
// user_id
// follow_user_id
