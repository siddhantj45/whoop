const axios = require('axios')
const WhoopToken = require('../models/WhoopToken')

const WHOOP_BASE = 'https://api.prod.whoop.com/developer'
const TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token'

async function getValidToken() {
  const token = await WhoopToken.findOne({ order: [['createdAt', 'DESC']] })
  if (!token) throw new Error('Whoop not connected. Visit /whoop/connect to authorize.')

  if (new Date() < new Date(token.expiresAt)) {
    return token.accessToken
  }

  if (!token.refreshToken) throw new Error('No refresh token. Re-authorize at /whoop/connect.')

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: token.refreshToken,
    client_id: process.env.WHOOP_CLIENT_ID,
    client_secret: process.env.WHOOP_CLIENT_SECRET,
    scope: 'offline'
  })

  const { data } = await axios.post(TOKEN_URL, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  })

  await token.update({
    accessToken: data.access_token,
    refreshToken: data.refresh_token || token.refreshToken,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
    scope: data.scope || token.scope
  })

  return data.access_token
}

async function whoopGet(path, params = {}) {
  const accessToken = await getValidToken()
  const { data } = await axios.get(`${WHOOP_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    params
  })
  return data
}

module.exports = { whoopGet }
