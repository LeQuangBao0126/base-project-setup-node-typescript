import { NextFunction, Response, Request } from 'express'
import { checkSchema } from 'express-validator'
import databaseService from '~/services/database.services'
import usersService from '~/services/users.services'
import { validate } from '~/utils/validation'

export const loginValidator = (req: Request, res: Response, next: NextFunction) => {
  console.log(req.body)
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(401).json({ message: 'thieu email hay password roi ' })
  }
  return next()
}

export const registerValidator = validate(
  checkSchema({
    name: {
      notEmpty: true,
      isLength: { options: { min: 1, max: 50 }, errorMessage: 'Độ dài name ko quá 1 -> 50' },
      trim: true
    },
    email: {
      notEmpty: true,
      isEmail: true,
      custom: {
        options: async (value) => {
          const isExist = await usersService.checkEmailExisting(value)
          if (isExist) {
            throw new Error('Email already existing')
          }
          return true
        }
      }
    },
    password: {
      notEmpty: true,
      isLength: { options: { min: 1, max: 50 }, errorMessage: 'Độ dài password ko quá 1 -> 50' }
    },
    confirm_password: {
      custom: {
        options: (value, { req }) => {
          if (value !== req.body.password) {
            throw new Error('Password confirm does not match password')
          }
          return true
        }
      }
    },
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
