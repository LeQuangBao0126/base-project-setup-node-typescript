import { Request, Response } from 'express'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR, UPLOAD_VIDEO_TEMP_DIR } from '~/constants/dir'
import mediasService from '~/services/medias.services'

export const uploadImageController = async (req: Request, res: Response) => {
  const urls = await mediasService.uploadImage(req)
  return res.status(200).json({ message: 'upload hình thành công', data: urls })
}

export const serveImageController = async (req: Request, res: Response) => {
  const { name } = req.params
  console.log(name)
  return res.sendFile(UPLOAD_IMAGE_DIR + '/' + name + '.jpg')
  //return res.status(200).json({ message: 'upload hình thành công', data: name })
}
export const serveVideoController = async (req: Request, res: Response) => {
  const { name } = req.params
  return res.sendFile(UPLOAD_VIDEO_DIR + '/' + name)
}

export const uploadVideoController = async (req: Request, res: Response) => {
  const rs = await mediasService.uploadVideo(req)
  return res.status(200).json({ message: 'upload video thành công', data: rs })
}
