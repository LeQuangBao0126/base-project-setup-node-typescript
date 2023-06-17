import { Request, Response, NextFunction } from 'express'
import { ValidationChain, validationResult } from 'express-validator'
import { RunnableValidationChains } from 'express-validator/src/middlewares/schema'

export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const result = await validation.run(req)

    const errors = validationResult(req)
    if (errors.isEmpty()) {
      return next()
    }

    //res.status(400).json({ errors: errors.array() }) // ra 2 lỗi của 1 field
    res.status(400).json({ errors: errors.mapped() }) // ra 1 lỗi của 1 field
  }
}
