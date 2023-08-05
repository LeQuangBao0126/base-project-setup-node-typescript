import User from './models/schemas/User.schema'
import { Request } from 'express'
import { TokenPayload } from './models/requests/User.requests'
import Tweet from './models/schemas/Tweet.schema'
// trong file nay setup global type . vd Request de gan user vao . middleware

//mở rộng kiểu dữ liệu
declare module 'express' {
  interface Request {
    user?: User
    decoded_authorization?: TokenPayload
    decoded_refresh_token?: TokenPayload
    decoded_email_verify_token?: TokenPayload
    decoded_forgot_password_token?: TokenPayload
    tweet?: Tweet
  }
}
