import 'dotenv/config'
import express from 'express'
import usersRouter from './routes/users.routes'
import databaseService from '~/services/database.services'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import mediasRouter from './routes/medias.routes'
import staticRouter from './routes/statics.routes'
import { initFolder } from './utils/file'
import { UPLOAD_VIDEO_DIR } from './constants/dir'
import cors from 'cors'
import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb'
import tweetRouter from './routes/tweets.routes'
import bookmartRouter from './routes/bookmarks.routes'
import { Server } from 'socket.io'
import { seedingData } from './utils/fake'
import searchRouter from './routes/search.route'
import { createServer } from 'http'
import '~/utils/s3'
import Conversation from './models/schemas/Conversation.schemas'
import conversationRoutes from './routes/conversations.routes'
import { verifyAccessToken } from './utils/commons'
import { TokenPayload } from './models/requests/User.requests'
import { UserVerifyStatus } from './constants/enum'
import { ErrorWithStatus } from './models/Error'
import HTTP_STATUS from './constants/httpStatus'

const app = express()

const port = process.env.PORT || 4000
const httpServer = createServer(app)
// Tạo folder upload
initFolder()

//web socket
const usersSocket: any = {}
const io = new Server(httpServer, { cors: { origin: '*' }, transports: ['websocket'] })

//su dung middleware socket . xac minh ng dung

io.use(async (socket, next) => {
  const { Authorization } = socket.handshake.auth
  const access_token = Authorization

  try {
    const decoded_authorization = await verifyAccessToken(access_token)
    const { verify } = decoded_authorization as TokenPayload
    if (verify !== UserVerifyStatus.Verified) {
      new ErrorWithStatus({ message: 'user is not verify', status: HTTP_STATUS.UNAUTHORIZED })
    }
    socket.handshake.auth.decoded_authorization = decoded_authorization
    socket.handshake.auth.access_token = access_token
    next()
    //nhay den middleware tiep socket
  } catch (err) {
    next({
      name: 'ERR_UNAUTHORIZED',
      message: 'unauthorized socket',
      data: err
    })
  }
})

///
databaseService
  .connect()
  .then((_) => databaseService.indexUsers())
  .then((_) => {
    app.use(
      cors({
        origin: '*'
      })
    )
    app.use(express.json())
    app.use('/users', usersRouter)
    app.use('/medias', mediasRouter)
    app.use('/tweets', tweetRouter)
    app.use('/bookmarks', bookmartRouter)
    app.use('/search', searchRouter)
    app.use('/conversations', conversationRoutes)
    //app.use('/statics', express.static(UPLOAD_IMAGE_DIR))
    app.use('/static', staticRouter)
    app.use('/static/video', express.static(UPLOAD_VIDEO_DIR))

    app.use(defaultErrorHandler)

    io.on('connection', (socket) => {
      const { user_id } = socket.handshake.auth.decoded_authorization as TokenPayload
      if (user_id) {
        usersSocket[user_id] = {
          socket_id: socket.id
        }
        // can be use redis
      }
      socket.use(async (event, next) => {
        const { access_token } = socket.handshake.auth
        try {
          await verifyAccessToken(access_token) // neu verify ko dc thì cho ra error
          next()
        } catch (err) {
          next(new Error('Unauthorized'))
        }
      })
      socket.on('error', (err) => {
        if (err.message === 'Unauthorized') {
          socket.disconnect()
        }
      })

      socket.on('c_send_message', (data) => {
        if (!usersSocket[data.receiver_id]) {
          socket.emit('s_user_not_online', { content: 'User kia hien dang ko online' })
        } else {
          databaseService.conversations.insertOne(
            new Conversation({
              sender_id: new ObjectId(data.sender_id),
              receiver_id: new ObjectId(data.receiver_id),
              content: data.content
            })
          )
          socket.to(usersSocket[data.receiver_id].socket_id).emit('s_response_message', data)
        }
      })
      socket.on('disconnect', (socket) => {
        delete usersSocket[user_id]
        // log history ... v...v
        console.log('1 thiet bi vua dang thoat ')
      })
    })

    httpServer.listen(port, () => {
      console.log(`App running in port ${port}`)
    })
  })
  .catch((err) => {
    console.log(err)
  })

//w6XihFfjoVhuxJhV database pass dbname twitter-dev
//mongodb+srv://quangbao01268183903:w6XihFfjoVhuxJhV@twitter-dev.eyatwzk.mongodb.net/

function getRandomNumber() {
  return Math.floor(Math.random() * 100) + 1
}
function initEarthDB() {
  const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_NAME}.eyatwzk.mongodb.net/`
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: false,
      deprecationErrors: true
    }
  })
  const db = client.db('earch').collection('users')
  const users = []

  for (let i = 0; i < 1000; i++) {
    const u = { name: 'users_' + i, age: getRandomNumber(), sex: i % 2 === 0 ? 'male' : 'female' }
    users.push(u)
  }
  db.insertMany(users)
}

//initEarthDB()
