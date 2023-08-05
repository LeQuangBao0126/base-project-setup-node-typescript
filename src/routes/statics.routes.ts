import { Router } from 'express'
import {
  serveImageController,
  serveVideoStreamController,
  serveM3U8Controller,
  serveSegmentController
} from '~/controllers/medias.controllers'

const staticRouter = Router()

staticRouter.get('/image/:name', serveImageController)
// lay 1 phat video 10GB
// staticRouter.get('/video-stream/:name', serveVideoController)
// lay video theo dang stream tu tu
staticRouter.get('/video-stream/:name', serveVideoStreamController)
//lay video theo kiểu m3u8 HLS
staticRouter.get('/video-hls/:id/master.m3u8', serveM3U8Controller)
staticRouter.get('/video-hls/:id/:v/:segment', serveSegmentController)
export default staticRouter
