const path = require('path')
const express = require('express')
const dotenv = require('dotenv')
const db = require('./config/db')
const whoopRouter = require('./routers/whoop')

dotenv.config()

const app = express()

app.use((req, res, next) => {
  let raw = ''
  req.on('data', chunk => { raw += chunk })
  req.on('end', () => { req.rawBody = raw })
  next()
})
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

app.use('/whoop', whoopRouter)

const PORT = process.env.PORT || 3333

db.sync().then(() => {
  console.log('Database ready')
  app.listen(PORT, () => console.log(`Whoop server running on port ${PORT}`))
})
