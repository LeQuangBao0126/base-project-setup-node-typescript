import jwt, { SignOptions } from 'jsonwebtoken'
import 'dotenv/config'
import { TokenPayload } from '~/models/requests/User.requests'
export const signToken = ({
  payload,
  privateKey,
  option = { algorithm: 'HS256' }
}: {
  payload: any
  privateKey: string
  option?: SignOptions
}) => {
  return new Promise<string>((resolve, reject) => {
    jwt.sign(payload, privateKey, option, (error, token) => {
      if (error) {
        throw reject(error)
      }
      resolve(token as string)
    })
  })
}
export const verifyToken = ({ token, secretOrPublicKey }: { token: string; secretOrPublicKey: string }) => {
  return new Promise<TokenPayload>((resolve, reject) => {
    jwt.verify(token, secretOrPublicKey, (error, decoded) => {
      if (error) {
        throw reject(error)
      }

      resolve(decoded as TokenPayload)
    })
  })
  return
}
