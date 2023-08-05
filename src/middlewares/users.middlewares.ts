import { NextFunction, Request, Response } from 'express'
import { ParamSchema, checkSchema } from 'express-validator'
import { JsonWebTokenError } from 'jsonwebtoken'
import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '~/constants/enum'
import HTTP_STATUS from '~/constants/httpStatus'
import { USER_MESSAGES } from '~/constants/messages'
import { REGEX_USERNAME } from '~/constants/regex'
import { ErrorWithStatus } from '~/models/Error'
import { TokenPayload } from '~/models/requests/User.requests'
import databaseService from '~/services/database.services'
import usersService from '~/services/users.services'
import { hashPassword } from '~/utils/crypto'
import { verifyToken } from '~/utils/jwt'
import { validate } from '~/utils/validation'

const passwordSchema: ParamSchema = {
  isString: {
    errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_STRING
  },
  isLength: { options: { min: 1, max: 50 }, errorMessage: 'Độ dài password ko quá 1 -> 50' }
}
const confirmPasswordSchema: ParamSchema = {
  custom: {
    options: (value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirm does not match password') //422
      }
      return true
    }
  }
}
const forgotPasswordTokenSchema: ParamSchema = {
  trim: true,
  custom: {
    options: async (value: string, { req }) => {
      try {
        const decoded_forgot_password_token = await verifyToken({
          token: value,
          secretOrPublicKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
        })
        const user_id = decoded_forgot_password_token?.user_id
        const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
        if (user === null) {
          throw new ErrorWithStatus({
            message: 'ko hop le',
            status: HTTP_STATUS.UNAUTHORIZED
          })
        }

        ;(req as Request).decoded_forgot_password_token = decoded_forgot_password_token
        return true
      } catch (err) {
        // neu bị expire thì phải quăng lỗi 401 và msg expire
        if (err instanceof JsonWebTokenError) {
          throw new ErrorWithStatus({
            message: 'forgot password token khong hop lệ (hết hạn) ',
            status: 401
          })
        }
        throw err
      }
    }
  }
}
const nameSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: USER_MESSAGES.NAME_MUST_BE_A_STRING
  }
}
const dateOfBirthSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: USER_MESSAGES.NAME_MUST_BE_A_STRING
  }
}
const usernameSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: USER_MESSAGES.USERNAME_MUST_BE_STRING
  },
  trim: true,
  custom: {
    options: async (value, { req }) => {
      if (!REGEX_USERNAME.test(value)) {
        throw new Error('username is mut be 4-> 15 character and not to have any special character ')
      }
      // const user = await databaseService.users.findOne({ username: value })
      // if(user){

      // }
      return true
    }
  }
}
const imageSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: USER_MESSAGES.IMAGE_URL_MUST_BE_STRING
  },
  trim: true,
  isLength: {
    options: { max: 200, min: 1 },
    errorMessage: USER_MESSAGES.IMAGE_URL_LENGTH_FROM_TO
  }
}

export const loginValidator = validate(
  checkSchema(
    {
      password: passwordSchema,
      email: {
        isEmail: {
          errorMessage: USER_MESSAGES.EMAIL_IS_INVALID
        },
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.users.findOne({
              email: value.trim(),
              password: hashPassword(req.body.password)
            })
            if (!user) {
              //throw new Error(USER_MESSAGES.USER_NOT_FOUND)
              throw new ErrorWithStatus({ message: 'khong tim thay user', status: 400 })
            }
            req.user = user
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const registerValidator = validate(
  checkSchema({
    name: {
      notEmpty: {
        errorMessage: USER_MESSAGES.NAME_IS_REQUIRED
      },
      isString: {
        errorMessage: USER_MESSAGES.NAME_MUST_BE_A_STRING
      },
      isLength: { options: { min: 1, max: 100 }, errorMessage: USER_MESSAGES.NAME_LENGTH_MUST_BE_FROM_1_TO_100 },
      trim: true
    },
    email: {
      notEmpty: {
        errorMessage: USER_MESSAGES.EMAIL_IS_REQUIRED
      },
      isEmail: {
        errorMessage: USER_MESSAGES.EMAIL_IS_INVALID
      },
      custom: {
        options: async (value) => {
          const isExist = await usersService.checkEmailExisting(value)
          if (isExist) {
            throw new Error('Email already existing') // quang 422
          }
          return true
        }
      }
    },
    password: passwordSchema,
    confirm_password: confirmPasswordSchema,
    date_of_birth: {
      isISO8601: {
        options: {
          strict: true,
          strictSeparator: true
        }
      }
    }
  })
)

export const accessTokenValidator = validate(
  checkSchema(
    {
      authorization: {
        custom: {
          options: async (value: string, { req }) => {
            const accessToken = value.split(' ')[1]
            if (!accessToken) {
              throw new ErrorWithStatus({ message: USER_MESSAGES.ACCESS_TOKEN_IS_REQUIRED, status: 401 })
            }
            try {
              const decoded_authorization = await verifyToken({
                token: accessToken,
                secretOrPublicKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
              })
              ;(req as Request).decoded_authorization = decoded_authorization as TokenPayload
            } catch (error) {
              throw new ErrorWithStatus({ message: 'loi access token ', status: HTTP_STATUS.UNAUTHORIZED })
            }
            return true
          }
        }
      }
    },
    ['headers']
  )
)

export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        custom: {
          options: async (value: string, { req }) => {
            // neu bị expire thì phải quăng lỗi 401 và msg expire
            if (!value) {
              throw new ErrorWithStatus({ message: 'cần refresh token', status: 401 })
            }
            try {
              const [decoded_refresh_token, refresh_token] = await Promise.all([
                verifyToken({ token: value, secretOrPublicKey: process.env.JWT_SECRET_REFRESH_TOKEN as string }),
                databaseService.refreshTokens.findOne({ token: value })
              ])
              if (refresh_token === null) {
                throw new ErrorWithStatus({ message: 'refresh token khong tồn tại', status: 401 })
              }

              ;(req as Request).decoded_refresh_token = decoded_refresh_token
            } catch (err) {
              // neu bị expire thì phải quăng lỗi 401 và msg expire
              if (err instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: 'Refresh token khong hop lệ (hết hạn) ',
                  status: 401
                })
              }
              throw err
            }

            return true
          }
        }
      }
    },
    ['body']
  )
)

export const emailVerifyTokenValidator = validate(
  checkSchema({
    email_verify_token: {
      custom: {
        options: async (value, { req }) => {
          if (!value) {
            throw new ErrorWithStatus({
              message: USER_MESSAGES.EMAIL_VERIFY_TOKEN_IS_REQUIRED,
              status: HTTP_STATUS.UNAUTHORIZED
            })
          }

          const decoded_email_verify_token = await verifyToken({
            token: value,
            secretOrPublicKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string
          })
          req.decoded_email_verify_token = decoded_email_verify_token

          return true
        }
      }
    }
  })
)

export const forgotPasswordValidator = validate(
  checkSchema(
    {
      email: {
        isEmail: { errorMessage: 'Email không hợp lệ' },
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            const user = await databaseService.users.findOne({ email: value })
            if (!user) {
              throw new Error(USER_MESSAGES.USER_NOT_FOUND)
            }
            // check user banned
            ;(req as Request).user = user
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const verifyForgotPasswordValidator = validate(
  checkSchema(
    {
      forgot_password_token: forgotPasswordTokenSchema
    },
    ['body']
  )
)

export const resetPasswordValidator = validate(
  checkSchema(
    {
      password: passwordSchema,
      confirm_password: confirmPasswordSchema,
      forgot_password_token: forgotPasswordTokenSchema
    },
    ['body']
  )
)

export const verifyUserValidator = (req: Request, res: Response, next: NextFunction) => {
  const { verify } = req.decoded_authorization as TokenPayload
  console.log(verify)
  if (verify !== UserVerifyStatus.Verified) {
    //check cache
    res.status(403).json({ message: 'Bạn không có quyền truy cập ', status: 403 })
    return
  }
  next()
}

export const updateMeValidator = validate(
  checkSchema(
    {
      // optional là khi có name mới validate , notEmpty undefined thì bỏ validate notEmpty ra
      name: { ...nameSchema, optional: true, notEmpty: undefined },
      date_of_birth: dateOfBirthSchema,
      bio: {
        optional: true,
        isString: {
          errorMessage: USER_MESSAGES.BIO_MUST_BE_STRING
        },
        isLength: {
          options: { max: 200, min: 5 },
          errorMessage: USER_MESSAGES.BIO_LENGTH_FROM_TO
        }
      },
      location: {
        optional: true,
        isString: {
          errorMessage: USER_MESSAGES.LOCATION_MUST_BE_STRING
        },
        isLength: {
          options: { max: 200, min: 1 },
          errorMessage: USER_MESSAGES.LOCATION_LENGTH_FROM_TO
        }
      },
      website: {
        optional: true,
        isString: {
          errorMessage: USER_MESSAGES.WEBSITE_MUST_BE_STRING
        },
        isLength: {
          options: { max: 200, min: 1 },
          errorMessage: USER_MESSAGES.WEBSITE_LENGTH_FROM_TO
        }
      },
      username: usernameSchema,
      avatar: imageSchema,
      cover_photo: imageSchema
    },
    ['body']
  )
)

export const isUserLoggedInValidator = (middleware: (req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.headers.authorization) {
        return middleware(req, res, next)
      }
      next()
    } catch (err) {
      next(err)
    }
  }
}
