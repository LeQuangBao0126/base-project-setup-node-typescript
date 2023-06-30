import { Request, Response, NextFunction } from 'express'
import { ValidationChain, validationResult } from 'express-validator'
import { RunnableValidationChains } from 'express-validator/src/middlewares/schema'
import { omit } from 'lodash'
import { EntityError, ErrorWithStatus } from '~/models/Error'

export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // goi nó sẽ check lõi và đưa vào req
    await validation.run(req)
    // lấy lỗi từ trong req ra
    const errors = validationResult(req)
    const errorObjects = errors.mapped()
    const entityError = new EntityError({ errors: {} })

    if (errors.isEmpty()) {
      return next()
    }

    for (const key in errorObjects) {
      const { msg } = errorObjects[key]
      if (msg instanceof ErrorWithStatus && msg.status !== 422) {
        return next(msg)
      }
      const r = omit(errorObjects[key], ['value', 'type', 'location'])
      entityError.errors[key] = { ...r } as any
    }

    //res.status(400).json({ errors: errors.array() }) // ra 2 lỗi của 1 field
    // res.status(422).json({ errors: errorObjects }) // ra 1 lỗi của 1 field
    next(entityError)
  }
}
