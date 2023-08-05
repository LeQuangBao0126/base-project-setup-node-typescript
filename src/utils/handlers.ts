import { Request, RequestHandler, Response, NextFunction } from 'express'

export const wrapRequestHandler = <P>(func: RequestHandler<any, any, any, any>) => {
  return async (req: Request<P>, res: Response, next: NextFunction) => {
    try {
      await func(req, res, next)
      return
    } catch (err) {
      next(err)
    }
  }
}
