import { Request } from 'express'
import { getFiles, getNameFromFullName, handleUploadImage, handleUploadVideo } from '~/utils/file'
import sharp from 'sharp'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import { isProduction } from '~/constants/config'
import 'dotenv/config'
import { EncodingStatus, MediaType } from '~/constants/enum'
import { Media } from '~/models/other'
import { encodeHLSWithMultipleVideoStreams } from '~/utils/video'
import fs from 'fs'
import databaseService from './database.services'
import { uploadFileToS3 } from '~/utils/s3'
import mime from 'mime'
import { CompleteMultipartUploadCommandOutput } from '@aws-sdk/client-s3'
import path from 'path'
import fsPromise from 'fs/promises'
// service này xứ lý file và xử lý hình ảnh

class Queue {
  items: string[]
  encoding: boolean
  constructor() {
    this.items = []
    this.encoding = false
  }

  async enqueue(item: string) {
    this.items.push(item)
    const idName = getNameFromFullName(item.split('\\').pop() as string)
    // them   video status để tranking chơi
    await databaseService.videoStatuss.insertOne({ name: idName, status: EncodingStatus.Pending })
    console.log('Start pending ')
    this.processEncode()
  }

  async processEncode() {
    if (this.encoding) return
    if (this.items.length > 0) {
      this.encoding = true
      const videoPath = this.items[0]
      const idName = getNameFromFullName(videoPath.split('\\').pop() as string)
      // them video status để tranking chơi
      await databaseService.videoStatuss.updateOne(
        { name: idName },
        {
          $set: { status: EncodingStatus.Processing },
          $currentDate: {
            updated_at: true
          }
        }
      )
      try {
        console.log('Bat dau vo encode')
        await encodeHLSWithMultipleVideoStreams(videoPath)

        this.items.shift() // xoa item dau
        console.log(`Encode Video ${videoPath} succes `)
        //
        // encode xong . lấy các files path trong thư muc để upload S3
        const files = getFiles(path.resolve(UPLOAD_VIDEO_DIR, idName))

        await Promise.all(
          files.map(async (filePath) => {
            //c:\Users\admin\Desktop\hocnodejs\TwitterAPIClone\Tweet\uploads\videos\ CVU1AADFG\
            const fileName = 'video-hls' + filePath.replace(path.resolve(UPLOAD_VIDEO_DIR), '').replace('\\', '/')
            return uploadFileToS3({ filePath, fileName, contentType: mime.getType(filePath) as string })
          })
        )

        await Promise.all([fsPromise.unlink(path.resolve(UPLOAD_VIDEO_DIR, idName))])

        // update status
        await databaseService.videoStatuss.updateOne(
          { name: idName },
          {
            $set: { status: EncodingStatus.Success },
            $currentDate: {
              updated_at: true
            }
          }
        )
      } catch (error) {
        console.log(`Encode Video ${videoPath} FAILL  `)
        await databaseService.videoStatuss.updateOne(
          { name: idName },
          {
            $set: { status: EncodingStatus.Failed },
            $currentDate: {
              updated_at: true
            }
          }
        )
      } finally {
        this.encoding = false
      }
      this.processEncode()
    } else {
      console.log(`Queue is empty`)
    }
  }
}
const queue = new Queue() // tạo 1 instance thoi
class MediasService {
  /*
    S3 upload
  */
  async uploadImage(req: Request) {
    const files = await handleUploadImage(req)
    const result = await Promise.all(
      files.map(async (file) => {
        const newName = getNameFromFullName(file.newFilename)
        const newFullFileName = `${newName}.jpg`
        const newPath = UPLOAD_IMAGE_DIR + '/' + newFullFileName
        // fs.unlinkSync(file.filepath)
        await sharp(file.filepath).resize(200, 200).toFile(newPath)
        console.log('nen success')
        // upload s3
        const s3Rs = await uploadFileToS3({
          fileName: newFullFileName,
          filePath: newPath,
          contentType: mime.getType(newPath) as string
        })

        console.log('upload s3 success')
        // xoa file temp va file da upload trong local luon
        fs.unlinkSync(newPath)
        fs.unlinkSync(file.filepath)
        console.log('delete file  success')
        return {
          url: (s3Rs as CompleteMultipartUploadCommandOutput).Location,
          type: MediaType.Image
        }
        // return {
        //   url: isProduction
        //     ? `${process.env.HOST}/static/${newFullFileName}`
        //     : `http://localhost:4000/static/${newFullFileName}`,
        //   type: MediaType.Image
        // }
      })
    )
    return result
  }

  async uploadVideo(req: Request) {
    const files = await handleUploadVideo(req)
    // khi mà upload hết thành cong tren server local

    // tạo thư mục s3 và quăng hết file lên

    //

    const { newFilename } = files[0]
    return {
      url: isProduction
        ? `${process.env.HOST}/static/video/${newFilename}`
        : `http://localhost:4000/static/video/${newFilename}`,
      type: MediaType.Video
    }
  }

  // S3 upload
  async uploadVideoHLS(req: Request) {
    const files = await handleUploadVideo(req)

    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        // sau khi tren server co files thi tien hanh encode sang HLS
        // await encodeHLSWithMultipleVideoStreams(file.filepath)
        // await fsPromise.unlink(file.filepath)
        queue.enqueue(file.filepath)

        // delete file when upload processing HLS  thanh cong
        file.newFilename = file.newFilename.replace('.mp4', '')
        return {
          url: isProduction
            ? `${process.env.HOST}/static/video-hls/${file.newFilename}.m3u8`
            : `http://localhost:4000/static/video-hls/${file.newFilename}.m3u8`,
          type: MediaType.HLS
        }
      })
    )
    return result
  }
}

const mediasService = new MediasService()
export default mediasService

//
