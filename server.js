const path = require('path')
const dotenv = require('dotenv')
dotenv.config()

const express = require('express')
const db = require('./config/db')
const whoopRouter = require('./routers/whoop')

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

db.sync().catch(err => console.error('DB sync error:', err))

if (require.main === module) {
  const PORT = process.env.PORT || 3333
  app.listen(PORT, () => console.log(`Whoop server running on port ${PORT}`))
}

module.exports = app
