import { S3 } from '@aws-sdk/client-s3'
import { config } from 'dotenv'
import { Upload } from '@aws-sdk/lib-storage'
import fs from 'fs'
import { Response } from 'express'
config()

const s3 = new S3({
  region: process.env.AWS_REGION,
  credentials: {
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string
  }
})
// nhớ phải thêm secretAccessKey và accessKeyId , mở thêm quyền S3FullAccess trong IAM
//const file = fs.readFileSync(path.resolve('uploads/images/hinhcho.jpg'))

export const uploadFileToS3 = ({
  fileName,
  filePath,
  contentType = 'image/jpg'
}: {
  fileName: string
  filePath: string
  contentType: string
}) => {
  const parallelUploads3 = new Upload({
    client: s3,
    params: {
      Bucket: process.env.S3_BUCKET_NAME as string,
      Key: fileName,
      Body: fs.readFileSync(filePath),
      ContentType: contentType
    }
  })
  return parallelUploads3.done()
}

export const sendFileFromS3 = async (res: Response, filePath: string) => {
  console.log(filePath)
  const data = await s3.getObject({
    Bucket: process.env.S3_BUCKET_NAME as string,
    Key: filePath
  }) // truyền buffer or stream về response
  ;(data.Body as any).pipe(res)
}

// test thử upload
// parallelUploads3.done().then((response) => {
//   console.log('After upload ::: ', response)
// })
