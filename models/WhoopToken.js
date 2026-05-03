const { DataTypes } = require('sequelize')
const db = require('../config/db')

module.exports = db.define('WhoopToken', {
  accessToken:  { type: DataTypes.TEXT, allowNull: false },
  refreshToken: { type: DataTypes.TEXT },
  expiresAt:    { type: DataTypes.DATE, allowNull: false },
  scope:        { type: DataTypes.TEXT }
})
