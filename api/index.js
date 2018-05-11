const _ = require('lodash')
const mongoose = require('mongoose')

const { promisify } = require('util')
const { app, router } = require('../engine/util/koa')

const Script = mongoose.model('Script')
const Task = mongoose.model('Task')

app.get('/script', async (ctx, next) => {
	try {
		const Script = new Script()
		const scripts = await Script.find()
		ctx.body = scripts
		await next()
	} catch (err) {
		console.error(err.message)
	}
})

app.post('/script', async (ctx, next) => {
	try {
		const script = new Script(ctx.request.body)
		const scripts = await script.save()
		ctx.body = scripts
		await next()
	} catch (err) {
		console.error(err.message)
	}
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

