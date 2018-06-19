const fs = require('fs')
const _ = require('lodash')
const mongoose = require('mongoose')
const Router = require('koa-router')
const Ajv = require('ajv')
const moment = require('moment')
const request = require('request')
const { NodeVM } = require('vm2')

const config = require('../config')
const Engine = require('../engine/index')
const util_mongodb = require('../engine/util/mongodb')

const ajv = new Ajv()
const router = new Router()
const Script = mongoose.model('Script')
const Task = mongoose.model('Task')
const Result = mongoose.model('Result')
const Scratch = mongoose.model('Scratch')

const getSchema = (script) => {
	let filePath = ''
	if (script.name === 'overspeed_alert') {
		filePath = config.file.overspeed_alert
	} else if (script.name === 'export_excel') {
		filePath = config.file.export_excel
	}

	// get script_schema
	const script_file = fs.readFileSync(filePath, { encoding: 'utf8' })
	const vm = new NodeVM({
		console: 'inherit',
		sandbox: {},
		require: {
			external: true,
			builtin: ['*'],
		}
	})
	const exec_result = vm.run(`${script_file}`, '../engine/index.js')
	return exec_result.onParamDeclare()
}

const verifyDataSchema = (schema, req_body) => {
	let valid = ''
	valid = ajv.validate(schema, req_body)
	if (!valid) {
		throw new Error('invalid data schema')
	}
	return true
}

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
		docs = await Script.find({})
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
	const schema = getSchema(the_script)
	const common_param = _.mapValues(schema.properties, o => o.type)
	const special_param = _.mapValues(schema.properties.params.properties, o => o.type)
	ctx.response.body = _.assign({}, common_param, special_param)
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
		docs = await Task.find({})
		ctx.response.body = docs
	}
	if (_.size(docs) === 0) {
		ctx.response.status = 404
		ctx.response.body = 'Not Found'
	}
	await next()
})

router.post('/task', async (ctx, next) => {
	const script = await Script.findById(ctx.request.body.script_id)
	const schema = getSchema(script)
	const is_valid = verifyDataSchema(schema, ctx.request.body)
	const tasks = await new Task(ctx.request.body).save()
	if (script && tasks && is_valid) {
		ctx.response.status = 200
		ctx.response.body = tasks._id
	} else {
		ctx.response.body = 'Failed to get the taks_id'
		ctx.response.status = 404
	}
	await next()
})

router.put('/task', async (ctx, next) => {
	const script = await Script.findById(ctx.request.body.script_id)
	const schema = getSchema(script)
	const is_valid = verifyDataSchema(schema, ctx.request.body)
	if (is_valid && script) {
		const task = await Task.findByIdAndUpdate(ctx.request.body.id, { $set: ctx.request.body }, { new: true })
		if (task) {
			ctx.response.status = 200
			ctx.response.body = task
		} else {
			ctx.response.status = 400
			ctx.response.body = 'failed to update task'
		}
	}
	await next()
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
		docs = await Result.find({})
		ctx.response.body = docs
	}
	if (_.size(docs) === 0) {
		ctx.response.status = 404
		ctx.response.body = 'Not Found'
	}
	await next()
})

// 超速告警订阅接口
router.post('/subcribe', async (ctx, next) => {
	const data = simulate_data(ctx.request.body.task_id)
	ctx.response.body = data
	await next()
})

const simulate_data = (task_id) => {
	setTimeout(simulate_data, 2000, task_id)
	const rs = {
		vehicle_ids: 'car_1',
		speed: 130,
		position: {
			lng: Math.random() * 180,
			lat: Math.random() * 90,
			address: '广东省珠海市香洲区南方软件园',
			location_time: Date.now()
		}
	}
	const options = {
		url: 'http://localhost:3000/callback/overspeed',
		method: 'POST',
		body: {
			data: rs,
			task_id,
			cb_key: 'overspeed'
		},
		json: true,
		resolveWithFullResponse: true
	}
	request(options, (err, res, body) => {
		if (err) {
			console.error(err)
		}
		if (res.statusCode === 200) {
			return body
		} else {
			return {
				statusCode: res.statusCode,
				message: res.statusMessage
			}
		}
	})
	return rs
}

router.post('/callback/overspeed', async (ctx ,next) => {
	const script_file = fs.readFileSync('./scripts/overspeed_alert.js', { encoding: 'utf8' })
	const db = await util_mongodb.connection(config.mongodb.dbHost, config.mongodb.dbPort, config.mongodb.dbName)
	const engine = new Engine(ctx.request.body.task_id, db)
	const vm = new NodeVM({
		console: 'inherit',
		sandbox: {
			engine,
			_,
			util_mongodb
		},
		require: {
			external: true,
			builtin: ['*'],
		}
	})
	const exec_result = vm.run(`${script_file}`, './engine/index.js')
	exec_result.onTaskData(ctx.request.body.data, ctx.request.body.cb_key)
	ctx.response.body = 'Completed subscribe data'
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

module.exports = router
