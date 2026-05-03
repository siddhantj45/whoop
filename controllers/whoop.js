const axios = require('axios')
const crypto = require('crypto')
const WhoopToken = require('../models/WhoopToken')
const { whoopGet } = require('../utils/whoopClient')

const AUTH_URL = 'https://api.prod.whoop.com/oauth/oauth2/auth'
const TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token'

const SCOPES = [
  'offline',
  'read:recovery',
  'read:cycles',
  'read:workout',
  'read:sleep',
  'read:profile',
  'read:body_measurement'
].join(' ')

exports.connect = (req, res) => {
  const state = crypto.randomBytes(4).toString('hex')
  const params = new URLSearchParams({
    client_id: process.env.WHOOP_CLIENT_ID,
    redirect_uri: process.env.WHOOP_REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    state
  })
  res.redirect(`${AUTH_URL}?${params.toString()}`)
}

exports.authUrl = (req, res) => {
  const state = crypto.randomBytes(4).toString('hex')
  const params = new URLSearchParams({
    client_id: process.env.WHOOP_CLIENT_ID,
    redirect_uri: process.env.WHOOP_REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    state
  })
  res.json({ url: `${AUTH_URL}?${params.toString()}` })
}

exports.callback = async (req, res) => {
  const { code, error, error_description } = req.query
  if (error || !code) {
    return res.status(400).json({
      success: false,
      error: error || 'No authorization code received',
      error_description: error_description || null
    })
  }

  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: process.env.WHOOP_CLIENT_ID,
      client_secret: process.env.WHOOP_CLIENT_SECRET,
      redirect_uri: process.env.WHOOP_REDIRECT_URI
    })

    const { data } = await axios.post(TOKEN_URL, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })

    await WhoopToken.destroy({ where: {} })
    await WhoopToken.create({
      accessToken: data.access_token,
      refreshToken: data.refresh_token || null,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
      scope: data.scope
    })

    res.json({ success: true, message: 'Whoop connected successfully', scope: data.scope })
  } catch (err) {
    res.status(500).json({ success: false, error: err.response?.data || err.message })
  }
}

exports.status = async (req, res) => {
  const token = await WhoopToken.findOne()
  if (!token) return res.json({ connected: false })
  const expired = new Date() >= new Date(token.expiresAt)
  res.json({ connected: true, expired, expiresAt: token.expiresAt, scope: token.scope })
}

exports.profile = async (req, res) => {
  try {
    res.json({ success: true, data: await whoopGet('/v2/user/profile/basic') })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

exports.recovery = async (req, res) => {
  try {
    res.json({ success: true, data: await whoopGet('/v2/recovery', req.query) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

exports.cycles = async (req, res) => {
  try {
    res.json({ success: true, data: await whoopGet('/v2/cycle', req.query) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

exports.sleep = async (req, res) => {
  try {
    res.json({ success: true, data: await whoopGet('/v2/activity/sleep', req.query) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

exports.workouts = async (req, res) => {
  try {
    res.json({ success: true, data: await whoopGet('/v2/activity/workout', req.query) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

exports.body = async (req, res) => {
  try {
    res.json({ success: true, data: await whoopGet('/v2/user/measurement/body') })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}
