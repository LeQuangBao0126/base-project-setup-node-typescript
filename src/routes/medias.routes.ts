import { Router } from 'express'
import {
  uploadImageController,
  uploadVideoController,
  uploadVideoHLSController,
  checkVideoStatusController
} from '~/controllers/medias.controllers'
import { wrapRequestHandler } from '~/utils/handlers'

const mediasRouter = Router()
mediasRouter.post('/upload-image', wrapRequestHandler(uploadImageController))
mediasRouter.post('/upload-video', wrapRequestHandler(uploadVideoController))
mediasRouter.post('/upload-video-hls', wrapRequestHandler(uploadVideoHLSController))
mediasRouter.get('/video/:name/check', checkVideoStatusController)
export default mediasRouter
