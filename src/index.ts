import express from 'express'
import usersRouter from './routes/users.routes'
import databaseService from '~/services/database.services'
const app = express()
const port = 3000
databaseService.connect().then((resp) => {
  app.use(express.json())
  app.use('/users', usersRouter)

  app.listen(port, () => {
    console.log(`App running in port ${port}`)
  })
})

//w6XihFfjoVhuxJhV database pass dbname twitter-dev
//mongodb+srv://quangbao01268183903:w6XihFfjoVhuxJhV@twitter-dev.eyatwzk.mongodb.net/
