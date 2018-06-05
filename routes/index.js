const fs = require('fs')
const _ = require('lodash')
const mongoose = require('mongoose')
const Router = require('koa-router')
const Ajv = require('ajv')
const moment = require('moment')
const config = require('../config')

const ajv = new Ajv()
const router = new Router()
const Script = mongoose.model('Script')
const Task = mongoose.model('Task')
const Result = mongoose.model('Result')
const Scratch = mongoose.model('Scratch')

router.get('/', async (ctx, next) => {
	ctx.body = 'hello world'
	await next()
})

router.get('/script', async (ctx, next) => {
	let docs = null
	if (_.size(ctx.query) > 0) {
		docs = await Script.findOne(ctx.query)
		ctx.response.body = {
			id: docs._id,
			owner_id: docs.owner_id,
			name: docs.name
		}
	} else {
		docs = await Script.find({}).exec()
		ctx.response.body = docs
	}
	if (_.size(docs) === 0) {
		ctx.response.status = 404
		ctx.response.body = 'Not Found'
	}
	await next()
})

router.post('/script', async (ctx, next) => {
	if (ctx.request.body.name === 'overspeed_alert') {
		ctx.request.body.script = fs.readFileSync('./scripts/overspeed_alert.js', { encoding: 'utf8' })
	}
	if (ctx.request.body.name === 'export_excel') {
		ctx.request.body.script = fs.readFileSync('./scripts/export_excel.js', { encoding: 'utf8' })
	}
	const script = new Script(ctx.request.body)
	const scripts = await script.save()
	if (scripts) {
		ctx.response.status = 200
		ctx.response.body = scripts._id
	} else {
		ctx.response.body = 'Failed to insert'
		ctx.response.status = 500
	}
	await next()
})

router.get('/script/params', async (ctx, next) => {
	const the_script = await Script.findOne(ctx.query)
	if (the_script.name === 'overspeed_alert') {
		const common_param = _.mapValues(config.alert_schema.properties, o => o.type)
		const special_param = _.mapValues(config.alert_schema.properties.params.properties, o => o.type)
		ctx.response.body = _.assign({}, common_param, special_param)
	}
	if (the_script.name === 'export_excel') {
		const common_param = _.mapValues(config.export_schema.properties, o => o.type)
		const special_param = _.mapValues(config.export_schema.properties.params.properties, o => o.type)
		ctx.response.body = _.assign({}, common_param, special_param)
	}
	await next()
})

router.get('/task', async (ctx, next) => {
	let docs = {}
	if (_.size(ctx.query) > 0) {
		docs = await Task.findOne(ctx.query)
		ctx.response.body = {
			id: docs._id,
			owner_id: docs.owner_id,
			name: docs.name,
			script_id: docs.script_id,
			time: moment(docs.time).format('YYYY-MM-DD HH:mm:ss'),
			params: docs.params,
			create_time: moment(docs.create_time).format('YYYY-MM-DD HH:mm:ss')
		}
	} else {
		docs = await Task.find({}).exec()
		ctx.response.body = docs
	}
	if (_.size(docs) === 0) {
		ctx.response.status = 404
		ctx.response.body = 'Not Found'
	}
	await next()
})

router.post('/task', async (ctx, next) => {
	let valid = ''
	const task = new Task(ctx.request.body)
	const script = await Script.findById(ctx.request.body.script_id)
	if (script.name === 'overspeed_alert') {
		valid = ajv.validate(config.alert_schema, ctx.request.body)
	}
	if (script.name === 'export_excel') {
		valid = ajv.validate(config.export_schema, ctx.request.body)
	}
	if (!valid) {
		throw new Error('invalid data schema')
	}
	const tasks = await task.save()
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
	let docs = {}
	if (_.size(ctx.query) > 0) {
		docs = await Result.findOne(ctx.query)
		ctx.response.body = {
			id: docs._id,
			type: docs.type,
			data: docs.data,
			task_id: docs.task_id,
			create_time: moment(docs.create_time).format('YYYY-MM-DD HH:mm:ss')
		}
	} else {
		docs = await Result.find({}).exec()
		ctx.response.body = docs
	}
	if (_.size(docs) === 0) {
		ctx.response.status = 404
		ctx.response.body = 'Not Found'
	}
	await next()
})

// 超速告警订阅接口
router.get('/subcribe/overspeed', async (ctx, next) => {
	const rs = [
		{
			vehicle_ids: `car_${Math.floor(Math.random() * 1000)}`,
			speed: Math.floor(Math.random() * 200),
			position: {
				lng: Math.random() * 180,
				lat: Math.random() * 90,
				address: '广东省珠海市香洲区南方软件园',
				location_time: Date.now()
			}
		},
		{
			vehicle_ids: `car_${Math.floor(Math.random() * 1000)}`,
			speed: Math.floor(Math.random() * 200),
			position: {
				lng: Math.random() * 180,
				lat: Math.random() * 90,
				address: '广东省珠海市香洲区东岸社区',
				location_time: Date.now()
			}
		}
	]
	ctx.response.body = rs
	await next()
})

router.get('/export_tracks', async (ctx, next) => {
	const rs = [
		{ vehicle_ids: 'car_one', timestamp: Date.now(), lng: Math.random() * 180, lat: Math.random() * 90 },
		{ vehicle_ids: 'car_two', timestamp: Date.now(), lng: Math.random() * 180, lat: Math.random() * 90 },
	]
	ctx.response.body = rs
	await next()
})

router.get('/export_millege', async (ctx, next) => {
	const rs = [
		{ vehicle_ids: 'car_one', timestamp: Date.now(), lng: Math.random() * 180, lat: Math.random() * 90 },
		{ vehicle_ids: 'car_two', timestamp: Date.now(), lng: Math.random() * 180, lat: Math.random() * 90 },
	]
	ctx.response.body = rs
	await next()
})

router.post('/alert/overspeed', async (ctx ,next) => {
	ctx.response.body = 'test passed'
	await next()
})

router.post('/alert/long_stay', async (ctx ,next) => {
	ctx.response.body = 'test passed'
	await next()
})

module.exports = router
