import { Router } from 'express'
import { bookmartController, unBookmarkController } from '~/controllers/bookmarks.controllers'
import { accessTokenValidator, verifyUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const bookmartRouter = Router()

bookmartRouter.post('', accessTokenValidator, verifyUserValidator, wrapRequestHandler(bookmartController))
bookmartRouter.delete('', accessTokenValidator, verifyUserValidator, wrapRequestHandler(unBookmarkController))

export default bookmartRouter
