require('pg')
const { Sequelize } = require('sequelize')

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is not set. Whoop API routes cannot reach the database.')
}

// A placeholder URL lets the function boot and serve the dashboard when a
// preview deployment has no database env. Queries fail until a real URL is set.
module.exports = new Sequelize(url || 'postgres://127.0.0.1:5432/whoop', {
  dialect: 'postgres',
  dialectOptions: url
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {},
  logging: false
})
