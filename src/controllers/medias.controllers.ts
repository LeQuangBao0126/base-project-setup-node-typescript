import { Request, Response } from 'express'
import fs from 'fs'
import path from 'path'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import mediasService from '~/services/medias.services'
import mime from 'mime'
import databaseService from '~/services/database.services'
import { sendFileFromS3 } from '~/utils/s3'

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

export const uploadVideoController = async (req: Request, res: Response) => {
  const rs = await mediasService.uploadVideo(req)
  return res.status(200).json({ message: 'upload video thành công', data: rs })
}
//streaming video file . not HLS
export const serveVideoStreamController = async (req: Request, res: Response) => {
  const range = req.headers.range
  if (!range) {
    return res.status(500).send('Yêu cầu gửi header range')
  }
  const { name } = req.params
  const videoPath = path.resolve(UPLOAD_VIDEO_DIR, name)
  //1MB = 10^6 bytes
  //Dung lượng video (bytes)
  const videoSize = fs.statSync(videoPath).size
  //Dung lượng video cho mỗi phân đoạn stream
  const chunkSize = 1 * 10 ** 6 // 1MB
  //Lấy giá trị byte bắt đầu từ header range  ()

  const start = Number(range.replace(/\D/g, '')) // lấy số
  const end = Math.min(start + chunkSize, videoSize - 1)

  // Tính dung lượng thực tế cho mỗi đoạn video stream
  const contentLength = end - start + 1
  const contentType = mime.getType(videoPath) || 'video/*'
  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': contentType
  }
  res.writeHead(206, headers)
  const videoStream = fs.createReadStream(videoPath, { start, end })
  videoStream.pipe(res)
}

export const uploadVideoHLSController = async (req: Request, res: Response) => {
  const result = await mediasService.uploadVideoHLS(req)
  return res.status(200).json({ message: 'upload video hls success', data: result })
}

export const serveM3U8Controller = async (req: Request, res: Response) => {
  const { id } = req.params
  return sendFileFromS3(res, `video-hls/${id}/master.m3u8`)
  //return res.sendFile(path.resolve(UPLOAD_VIDEO_DIR, id, 'master.m3u8'))
}
export const serveSegmentController = async (req: Request, res: Response) => {
  const { id, v, segment } = req.params
  //neu client ko truyền segment.ts thì path phải .ts vô cho giống file
  return sendFileFromS3(res, `video-hls/${id}/${v}/${segment}`)
  //return res.sendFile(path.resolve(UPLOAD_VIDEO_DIR, id, v, segment))
}

export const checkVideoStatusController = async (req: Request, res: Response) => {
  const { name } = req.params

  // nho phai index thừ trong db
  const rs = await databaseService.videoStatuss.findOne({ name: name })

  if (!rs) {
    return res.status(200).json({ message: 'video is not exist' })
  }

  return res.status(200).json({ message: rs.status })
}
