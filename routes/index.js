const _ = require('lodash')
const mongoose = require('mongoose')
const Router = require('koa-router')

const router = new Router()
const Script = mongoose.model('Script')
const Task = mongoose.model('Task')

router.get('/', async (ctx, next) => {
	ctx.body = 'hello world'
	await next()
})

router.get('/script', async (ctx, next) => {
	const docs = await Script.find({})
	if (docs) {
		ctx.response.body = docs
	} else {
		ctx.response.status = 404
		ctx.response.body = 'Not Found'
	}
	await next()
})

router.post('/script', async (ctx, next) => {
	const script = new Script(ctx.request.body)
	const scripts = await script.save()
	if (scripts) {
		ctx.response.body = scripts
	} else {
		ctx.response.body = 'Failed to insert'
		ctx.response.status = 500
	}
	await next()
})

router.put('/script', async (ctx, next) => {

})

router.get('/script/params', async (ctx, next) => {

})

router.get('/task', async (ctx, next) => {
	const task = await Task.find({})
	if (task) {
		ctx.response.status = 200
		ctx.response.body = task
	} else {
		ctx.response.status = 404
		ctx.response.body = 'failed to find task'
	}
	await next()
})

router.post('/task', async (ctx, next) => {
	const task = new Task(ctx.request.body)
	const tasks = await task.save()
	const script = await Script.findById(tasks.script_id)
	if (script && tasks) {
		ctx.response.status = 200
		ctx.response.body = tasks._id
	} else {
		ctx.response.body = 'Failed to get the taks_id'
		ctx.response.status = 404
	}
	await next()
})

router.put('/task', async (ctx, next) => {

})

router.get('/result', async (ctx, next) => {
	
})

// 超速告警回调接口
router.get('/callback/overspeed', async (ctx, next) => {
	const rs = {
		vehicle_ids: `car_${Math.floor(Math.random() * 1000)}`,
		speed: 33,
		// speed: Math.floor(Math.random() * 300),
		position: {
			lng: Math.random() * 180,
			lat: Math.random() * 90,
			address: '广东省珠海市香洲区南方软件园',
			location_time: Date.now()
		}
	}
	console.log(`rs: ${JSON.stringify(rs)}`)
	ctx.response.body = rs
	await next()
})

router.get('/tracks', async (ctx, next) => {
	const rs = [
		{ vehicle_ids: 'car_one', timestamp: Date.now(), lng: Math.random() * 180, lat: Math.random() * 90 },
		{ vehicle_ids: 'car_two', timestamp: Date.now(), lng: Math.random() * 180, lat: Math.random() * 90 },
	]
	console.log(`rs: ${JSON.stringify(rs)}`)
	ctx.response.body = rs
	await next()
})

router.get('/millege', async (ctx, next) => {
	const rs = [
		{ vehicle_ids: 'car_one', timestamp: Date.now(), lng: Math.random() * 180, lat: Math.random() * 90 },
		{ vehicle_ids: 'car_two', timestamp: Date.now(), lng: Math.random() * 180, lat: Math.random() * 90 },
	]
	console.log(`rs: ${JSON.stringify(rs)}`)
	ctx.response.body = rs
	await next()
})

router.post('/alert/overspeed', async (ctx ,next) => {
	ctx.response.body = 'test passed'
	await next()
})

module.exports = router
