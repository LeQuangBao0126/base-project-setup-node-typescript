import jwt, { SignOptions } from 'jsonwebtoken'
import 'dotenv/config'
export const signToken = ({
  payload,
  privateKey = process.env.JWT_SECRET as string,
  option = { algorithm: 'HS256' }
}: {
  payload: any
  privateKey?: string
  option?: SignOptions
}) => {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, privateKey, option, (error, token) => {
      if (error) {
        throw reject(error)
      }
      resolve(token as string)
    })
  })
}
