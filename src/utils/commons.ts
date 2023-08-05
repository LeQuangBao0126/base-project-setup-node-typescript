import { USER_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Error'
import { verifyToken } from './jwt'
import { Request } from 'express'
import { TokenPayload } from '~/models/requests/User.requests'
import HTTP_STATUS from '~/constants/httpStatus'

export const numberEnumToArray = (numberEnum: { [key: string]: string | number }) => {
  const a = Object.values(numberEnum).filter((value) => typeof value === 'number') as number[]
  return a
}

export const verifyAccessToken = async (accessToken: string, req?: Request) => {
  if (!accessToken) {
    throw new ErrorWithStatus({ message: USER_MESSAGES.ACCESS_TOKEN_IS_REQUIRED, status: 401 })
  }
  try {
    const decoded_authorization = await verifyToken({
      token: accessToken,
      secretOrPublicKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
    })
    if (req) {
      ;(req as Request).decoded_authorization = decoded_authorization as TokenPayload
      return true
    }
    return decoded_authorization
  } catch (error) {
    throw new ErrorWithStatus({ message: 'loi access token ', status: HTTP_STATUS.UNAUTHORIZED })
  }
}
