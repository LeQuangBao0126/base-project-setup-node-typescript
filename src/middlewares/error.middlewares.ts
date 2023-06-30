import { NextFunction, Request, Response } from 'express'
import HTTP_STATUS from '~/constants/httpStatus'
import { omit } from 'lodash'
import { ErrorWithStatus } from '~/models/Error'

export const defaultErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof ErrorWithStatus) {
    return res.status(error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR).json(omit(error, 'status'))
  }
  //bien doi ra object
  Object.getOwnPropertyNames(error).forEach((key) => {
    Object.defineProperty(error, key, { enumerable: true })
  })

  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    message: error.message,
    errorInfo: omit(error, 'stack')
  })
}
