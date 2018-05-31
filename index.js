const Koa = require('koa')
const logger = require('koa-logger')
const bodyParser = require('koa-bodyparser')
const mongoose = require('mongoose')

mongoose.connect('mongodb://localhost/task_system', function(err, db) {
	if (!err) {
		console.log('Connected to /task_system!')
	} else {
		console.error('Failed to connect database')
	}
})

require('./models/Scripts')
require('./models/Tasks')

const router = require('./routes/index')
const app = new Koa()

app.use(logger())
app.use(async (ctx, next) => next()
	.catch(err => {
		ctx.body = String(err)
		ctx.status = err.status || 500
	})
)
app.use(bodyParser({
	onerror(error, ctx) {
		ctx.throw(400, `cannot parse request body, ${JSON.stringify(error)}`)
	}
}))
app.use(router.routes())
app.use(router.allowedMethods())

module.exports = app
