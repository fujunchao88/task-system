const _ = require('lodash')
const mongoose = require('mongoose')

const { promisify } = require('util')
const { app, router } = require('../engine/util/koa')

const Script = mongoose.model('Script')
const Task = mongoose.model('Task')

app.get('/script', async (ctx, next) => {
	const Script = new Script()
	Script.find((err, scripts) => {
		if (err) {
			throw new Error('failed to query collection script')
		}
		ctx.body = scripts
	})
	await next()
})

app.post('/script', async (ctx, next) => {
	const script = new Script(ctx.request.body)
	script.save((err, scripts) => {
		if (err) {
			throw new Error('failed to post script')
		}
		ctx.body = scripts
	})
	await next()
})

app.put('/script', async (ctx, next) => {

})

app.get('/script/params', async (ctx, next) => {

})

app.get('/task', async (ctx, next) => {

})

app.post('task', async (ctx, next) => {

})

app.put('/task', async (ctx, next) => {

})

app.get('/result', async (ctx, next) => {
	
})

