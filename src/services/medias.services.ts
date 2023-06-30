import { Request } from 'express'
import { getNameFromFullName, handleUploadImage, handleUploadVideo } from '~/utils/file'
import sharp from 'sharp'
import { UPLOAD_IMAGE_DIR } from '~/constants/dir'
import { isProduction } from '~/constants/config'
import 'dotenv/config'
import { MediaType } from '~/constants/enum'

// service này xứ lý file và xử lý hình ảnh
class MediasService {
  async uploadImage(req: Request) {
    const files = await handleUploadImage(req)
    const result = await Promise.all(
      files.map(async (file) => {
        const newName = getNameFromFullName(file.newFilename)
        const newPath = UPLOAD_IMAGE_DIR + '/' + `${newName}.jpg`
        // fs.unlinkSync(file.filepath)
        await sharp(file.filepath).resize(200, 200).toFile(newPath)
        return {
          url: isProduction
            ? `${process.env.HOST}/static/${newName}.jpg`
            : `http://localhost:4000/static/${newName}.jpg`,
          type: MediaType.Image
        }
      })
    )
    return result
  }

  async uploadVideo(req: Request) {
    const files = await handleUploadVideo(req)
    const { newFilename } = files[0]
    return {
      url: isProduction
        ? `${process.env.HOST}/static/video/${newFilename}`
        : `http://localhost:4000/static/video/${newFilename}`,
      type: MediaType.Video
    }
  }
}

const mediasService = new MediasService()
export default mediasService
