const Koa = require('Koa')
const logger = require('koa-logger')
const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')

const KoaApp = () => {
	const app = new Koa()
	const router = new Router()
	app.use(logger())
	app.use(async (ctx, next) => next()
		.catch(err => {
			console.dir(err)
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
	return {app, router}
}

const isValidDate = date => Object.prototype.toString.call(date) === '[object Date]' && !isNaN(date.getTime())

export {KoaApp, isValidDate}
