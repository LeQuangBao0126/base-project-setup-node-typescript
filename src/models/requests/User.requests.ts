import { JwtPayload } from 'jsonwebtoken'
import { TokenType, UserVerifyStatus } from '~/constants/enum'

export interface UpdateMeReqBody {
  name: string
  date_of_birth: string // ISO string
  bio?: string
  location?: string
  website?: string
  username?: string
  avatar?: string
  cover_photo?: string
}

export interface LoginRequestBody {
  email: string
  password: string
}
export interface VerifyEmailRequestBody {
  email_verify_token: string
}
export interface ForgotPasswordRequestBody {
  email: string
}
export interface RefreshTokenBody {
  refresh_token: string
}
export interface ResetPasswordRequestBody {
  password: string
  confirm_password: string
  forgot_password_token: string
}
export interface RegisterRequestBody {
  name: string
  email: string
  password: string
  confirm_password: string
  date_of_birth: string
}

export interface TokenPayload extends JwtPayload {
  user_id: string
  token_type: TokenType
  verify: UserVerifyStatus
  iat: number
  exp: number // no sẽ overwrite cái thằng cũ là number | undefined
}

export interface FollowReqBody {
  follow_user_id: string
}
