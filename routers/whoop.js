const express = require('express')
const {
  connect, authUrl, callback, status,
  profile, recovery, cycles, sleep, workouts, body
} = require('../controllers/whoop')
const { receive } = require('../controllers/webhook')
const { getData } = require('../controllers/dashboard')

const router = express.Router()

router.get('/connect', connect)
router.get('/auth-url', authUrl)
router.get('/callback', callback)
router.get('/status', status)
router.get('/profile', profile)
router.get('/recovery', recovery)
router.get('/cycles', cycles)
router.get('/sleep', sleep)
router.get('/workouts', workouts)
router.get('/body', body)
router.post('/webhook', receive)
router.get('/dashboard/data', getData)

module.exports = router
