import 'dotenv/config'
import express from 'express'
import usersRouter from './routes/users.routes'
import databaseService from '~/services/database.services'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import mediasRouter from './routes/medias.routes'
import staticRouter from './routes/statics.routes'
import { initFolder } from './utils/file'
import { UPLOAD_VIDEO_DIR } from './constants/dir'

const app = express()

const port = process.env.PORT || 4000

// Tạo folder upload
initFolder()

databaseService.connect().then((_) => {
  app.use(express.json())
  app.use('/users', usersRouter)
  app.use('/medias', mediasRouter)
  //app.use('/statics', express.static(UPLOAD_IMAGE_DIR))
  app.use('/static', staticRouter)
  app.use('/static/video', express.static(UPLOAD_VIDEO_DIR))

  app.use(defaultErrorHandler)

  app.listen(port, () => {
    console.log(`App running in port ${port}`)
  })
})

//w6XihFfjoVhuxJhV database pass dbname twitter-dev
//mongodb+srv://quangbao01268183903:w6XihFfjoVhuxJhV@twitter-dev.eyatwzk.mongodb.net/
