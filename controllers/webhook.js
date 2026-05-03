const crypto = require('crypto')

function validateSignature(req) {
  const timestamp = req.headers['x-whoop-signature-timestamp']
  const signature = req.headers['x-whoop-signature']
  if (!timestamp || !signature) return false

  const computed = crypto
    .createHmac('sha256', process.env.WHOOP_CLIENT_SECRET)
    .update(timestamp + req.rawBody)
    .digest('base64')

  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature))
}

exports.receive = (req, res) => {
  if (!validateSignature(req)) {
    return res.status(401).json({ error: 'Invalid signature' })
  }

  const { type, id, user_id, trace_id } = req.body
  console.log(`[webhook] ${type} | user=${user_id} | id=${id} | trace=${trace_id}`)

  res.status(200).json({ received: true })
}
