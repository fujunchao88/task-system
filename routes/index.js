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

const getSchema = (script) => {
	const filePath = `./scripts/${script.name}.js`

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
		return false
	}
	return true
}

const task_logic = async (ele, ctx) => {
	const obj = {}
	const picked_obj = _.pick(ele, ['script_id', 'vehicles', 'owner_id', 'name', 'time', 'params'])
	if (_.size(picked_obj) === 6) {
		const script = await Script.findById({ _id: mongoose.Types.ObjectId(ele.script_id) })
		if (script === null) {
			ctx.response.status = 404
			obj.statusCode = ctx.response.status
			obj.message = 'Unable to find this script'
			obj.data = {}
		} else {
			const schema = getSchema(script)
			const is_valid = verifyDataSchema(schema, ele)
			if (!is_valid) {
				ctx.response.status = 400
				obj.statusCode = ctx.response.status
				obj.message = 'Invalid request schema'
				obj.data = {}
			} else {
				const tasks = await new Task(ele).save()
				if (tasks === null) {
					ctx.response.status = 500
					obj.statusCode = ctx.response.status
					obj.message = 'Failed to insert data'
					obj.data = {}
				} else {
					ctx.response.status = 200
					obj.statusCode = ctx.response.status
					obj.message = 'Inserted data successfully'
					obj.data = tasks._id
				}
			}
		}
	} else {
		ctx.response.status = 400
		obj.statusCode = ctx.response.status
		obj.message = 'Invalid params, please input specified params'
		obj.data = {}
	}
	return obj
}

router.get('/', async (ctx, next) => {
	ctx.body = 'hello world'
	await next()
})

router.get('/script', async (ctx, next) => {
	const obj = {}
	if (_.has(ctx.query, '_id') && _.size(ctx.query) === 1) {
		const docs = await Script.findOne({ _id: mongoose.Types.ObjectId(ctx.query._id)})
		if (docs === null) {
			ctx.response.status = 404
			obj.message = 'Not Found'
		} else {
			ctx.response.status = 200
			obj.message = 'Get script successfully'
			obj.data = {
				id: docs._id,
				owner_id: docs.owner_id,
				name: docs.name
			}
		}
	} else {
		ctx.response.status = 400
		obj.message = 'Invalid params, please input specified params'
	}
	ctx.response.body = {
		statusCode: ctx.response.status,
		message: obj.message,
		data: obj.data ? obj.data : {}
	}
	await next()
})

router.post('/script', async (ctx, next) => {
	const obj = {}
	if (ctx.request.body.name && ctx.request.body.owner_id) {
		if (_.isString(ctx.request.body.name) && _.isString(ctx.request.body.owner_id)) {
			const isFile_exist = fs.existsSync(`./scripts/${ctx.request.body.name}.js`)
			if (isFile_exist) {
				ctx.request.body.script = fs.readFileSync(`./scripts/${ctx.request.body.name}.js`, { encoding: 'utf8' })
			} else {
				ctx.request.body.script = null
			}
		}
		const value_arr = _.compact(_.values(ctx.request.body))
		if (value_arr.length === _.size(ctx.request.body)) {
			const script = new Script(ctx.request.body)
			const scripts = await script.save()
			if (scripts) {
				ctx.response.status = 200
				obj.message = 'Post script successfully'
				obj.data = scripts._id
			} else {
				ctx.response.status = 500
				obj.message = 'Failed to insert data'
			}
		} else {
			ctx.response.status = 400
			obj.message = 'Invalid request body'
		}
	} else {
		ctx.response.status = 400
		obj.message = 'Lack of request params'
	}
	ctx.response.body = {
		statusCode: ctx.response.status,
		message: obj.message,
		data: obj.data ? obj.data : {}
	}
	await next()
})

router.get('/script/params', async (ctx, next) => {
	const obj = {}
	if (_.has(ctx.query, '_id') && _.size(ctx.query) === 1) {
		const the_script = await Script.findOne({ _id: mongoose.Types.ObjectId(ctx.query._id)})
		if (the_script !== null) {
			const schema = getSchema(the_script)
			const common_param = _.mapValues(schema.properties, o => o.type)
			const special_param = _.mapValues(schema.properties.params.properties, o => o.type)
			ctx.response.status = 200
			obj.message = 'Get script params successfully'
			obj.data = _.assign({}, common_param, special_param)
		} else {
			ctx.response.status = 404
			obj.message = 'This script not exists'
		}
	} else {
		ctx.response.status = 400
		obj.message = 'Invalid params, please input specified params'
	}
	ctx.response.body = {
		statusCode: ctx.response.status,
		message: obj.message,
		data: obj.data ? obj.data : {}
	}
	await next()
})

router.get('/task', async (ctx, next) => {
	const obj = {}
	let docs = {}
	if (_.has(ctx.query, 'name') && _.size(ctx.query) === 1) {
		docs = await Task.findOne({ name: ctx.query.name })
		if (docs !== null) {
			ctx.response.status = 200
			obj.message = 'Get task successfully'
			obj.data = {
				id: docs._id,
				owner_id: docs.owner_id,
				name: docs.name,
				script_id: docs.script_id,
				time: moment(docs.time).format('YYYY-MM-DD HH:mm:ss'),
				params: docs.params,
				create_time: moment(docs.create_time).format('YYYY-MM-DD HH:mm:ss')
			}
		} else {
			ctx.response.status = 404
			obj.message = 'Not Found'
		}
	} else {
		ctx.response.status = 400
		obj.message = 'Invalid params, please input specified params'
	}
	ctx.response.body = {
		statusCode: ctx.response.status,
		message: obj.message,
		data: obj.data ? obj.data : {}
	}
	await next()
})

router.post('/task', async (ctx, next) => {
	if (ctx.request.body instanceof Array) {
		const obj_arr = []
		for (let each of ctx.request.body) {
			obj_arr.push(await task_logic(each, ctx))
		}
		ctx.response.body = obj_arr
	} else {
		const obj = await task_logic(ctx.request.body, ctx)
		ctx.response.body = {
			statusCode: obj.statusCode,
			message: obj.message,
			data: obj.data
		}
	}
	await next()
})

router.put('/task', async (ctx, next) => {
	const obj = {}
	const picked_obj = _.pick(ctx.request.body, ['id', 'script_id', 'owner_id', 'name', 'time', 'params'])
	if (_.size(picked_obj) === 6) {
		const script = await Script.findById({ _id: mongoose.Types.ObjectId(ctx.request.body.script_id) })
		if (script === null) {
			ctx.response.status = 404
			obj.message = 'Unable to find this script'
		} else {
			const schema = getSchema(script)
			const is_valid = verifyDataSchema(schema, ctx.request.body)
			if (!is_valid) {
				ctx.response.status = 400
				obj.message = 'Invalid request schema'
			} else {
				const task = await Task.findByIdAndUpdate(ctx.request.body.id, { $set: {
					owner_id: ctx.request.body.owner_id,
					name: ctx.request.body.name,
					time: ctx.request.body.time,
					params: ctx.request.body.params
				} }, { new: true })
				if (!task) {
					ctx.response.status = 404
					obj.message = 'Unable to find this task'
				} else {
					ctx.response.status = 200
					obj.message = 'Updated data successfully'
					obj.data = task
				}
			}
		}
	} else {
		ctx.response.status = 400
		obj.message = 'Invalid params, please input specified params'
	}
	ctx.response.body = {
		statusCode: ctx.response.status,
		message: obj.message,
		data: obj.data ? obj.data : {}
	}
	await next()
})

router.delete('/task', async (ctx, next) => {
	const obj = {}
	if (ctx.request.body.task_id && _.isString(ctx.request.body.task_id)) {
		const task = await Task.findById(ctx.request.body.task_id)
		if (task !== null) {
			const rs = await Task.findByIdAndRemove(ctx.request.body.task_id)
			if (rs !== null) {
				ctx.response.status = 200
				obj.message = 'Remove task successfully'
				obj.data = rs
			} else {
				ctx.response.status = 500
				obj.message = 'Failed to remove task'
			}
		} else {
			ctx.response.status = 404
			obj.message = 'Cannot find this task'
		}
	} else {
		ctx.response.status = 400
		obj.message = 'Invalid task_id, please check your input params'
	}
	ctx.response.body = {
		statusCode: ctx.response.status,
		message: obj.message,
		data: obj.data ? obj.data : {}
	}
	await next()
})

router.get('/result', async (ctx, next) => {
	const obj = {}
	if (_.has(ctx.query, 'id') && _.size(ctx.query) === 1) {
		const docs = await Result.findOne({ _id: mongoose.Types.ObjectId(ctx.query.id)})
		if (docs === null) {
			ctx.response.status = 404
			obj.message = 'Cannot find his result'
		} else {
			ctx.response.status = 200
			obj.message = 'Get result successfully'
			obj.data = {
				id: docs.id,
				type: docs.type,
				data: docs.data,
				task_id: docs.task_id,
				create_time: moment(docs.create_time).format('YYYY-MM-DD HH:mm:ss')
			}
		}
	} else {
		ctx.response.status = 400
		obj.message = 'Invalid params, please input specified params'
	}
	ctx.response.body = {
		statusCode: ctx.response.status,
		message: obj.message,
		data: obj.data ? obj.data : {}
	}
	await next()
})

// 超速告警订阅接口
router.post('/vehicle/subscription', async (ctx, next) => {
	const data = simulate_data(ctx.request.body.task_id)
	ctx.response.body = data
	await next()
})

router.post('/unsubscription', async (ctx, next) => {
	const obj = {}
	if (ctx.request.body.task_id && ctx.request.body.sub_id) {
		if (_.isString(ctx.request.body.task_id) && _.isString(ctx.request.body.sub_id)) {
			ctx.response.status = 200
			obj.statusCode = ctx.response.status
			obj.message = 'Operation successfully'
			obj.data = 'ok'
		} else {
			ctx.response.status = 400
			obj.statusCode = ctx.response.status
			obj.message = 'Invalid format of params'
			obj.data = {}
		}
	} else {
		ctx.response.status = 400
		obj.statusCode = ctx.response.status
		obj.message = 'Please checkout your params'
		obj.data = {}
	}
	ctx.response.body = obj
	await next()
})

const simulate_data = (task_id) => {
	setTimeout(simulate_data, 2000, task_id)
	const rs = {
		sub_id: `subID_${Math.floor(Math.random())}`,
		vehicle_id: 'car_1',
		speed: 130,
		location: {
			lng: Math.random() * 180,
			lat: Math.random() * 90,
			address: '广东省珠海市香洲区南方软件园',
			locate_time: Date.now()
		}
	}
	const options = {
		url: `${config.business_server.gateway}/vehicle/subscription`,
		method: 'POST',
		body: {
			data: rs,
			task_id
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

router.post('/subscription_callback', async (ctx ,next) => {
	const db = await util_mongodb.connection(config.mongodb.dbHost, config.mongodb.dbPort, config.mongodb.dbName)
	const task = await util_mongodb.findTaskById(ctx.request.body.task_id)
	const script_name = await util_mongodb.findScriptNameById(db, task)
	const script_file = fs.readFileSync(`./scripts/${script_name}.js`, { encoding: 'utf8' })
	const engine = new Engine(ctx.request.body.task_id, db)
	const vm = new NodeVM({
		console: 'inherit',
		sandbox: {
			engine,
			task,
			_
		},
		require: {
			external: true,
			builtin: ['*'],
		}
	})
	const exec_result = vm.run(`${script_file}`, './engine/index.js')
	exec_result.onTaskData(ctx.request.body.data, engine.task_id)
	ctx.response.body = 'Completed subscribe data'
	await next()
})

router.post('/callback/alert-event', async (ctx ,next) => {
	ctx.response.body = 'callback successfully'
	await next()
})

router.get('/vehicle/location/latest', async (ctx, next) => {
	const rs = [
		{ vehicle_id: 'car_one', timestamp: Date.now(), lng: Math.random() * 180, lat: Math.random() * 90 },
		{ vehicle_id: 'car_two', timestamp: Date.now(), lng: Math.random() * 180, lat: Math.random() * 90 },
	]
	ctx.response.body = rs
	await next()
})

router.get('/vehicle/mileage', async (ctx, next) => {
	const rs = [
		{ vehicle_id: '123', belong_day: '19951101', mileage: 0 },
		{ vehicle_id: '123', belong_day: '19951102', mileage: 8.46 },
	]
	ctx.response.body = rs
	await next()
})

module.exports = router
