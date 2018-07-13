/* eslint-disable no-undef */
/* eslint-disable no-console */
const schema = {
	'type': 'object',
	'properties': {
		'script_id': { 'type': 'string'},
		'vehicles': {
			'type': 'array',
			'items': {
				'type': 'object',
				'properties': {
					'type': { 'type': 'string', 'enum': ['vehicle_list', 'apartment_list'] },
					'id_list': {'type': 'string' }
				},
				'required': [ 'type', 'id_list' ]
			}
		},
		'owner_id': { 'type': 'string' },
		'name': { 'type': 'string' },
		'time': { 'type': 'number'},
		'params': {
			'type': 'object',
			'properties': {
				'speed': {
					'type': 'number'
				},
			}
		}
	},
	'required': [
		'script_id',
		'vehicles',
		'owner_id',
		'name',
		'time',
		'params'
	]
}

function onParamDeclare() {
	return schema
}

// 指定任务逻辑
const onTaskExec = async () => {
	setTimeout(onTaskExec, 15000)
	engine.log('Overspeed_alert: in TaskExec')
	let list = null
	if (task.vehicles[0].type === 'vehicle_list') {
		list = _.split(task.vehicles[0].id_list, ',')
	}
	const options = {
		url: `${config.business_server.gateway}/vehicle/location/latest`,
		method: 'GET',
		qs: {
			vehicle_id: list,
		},
		useQuerystring: true,
		json: true,
		resolveWithFullResponse: true
	}
	request(options, async (err, res, body) => {
		if (err) {
			console.error(err)
		}
		if (res.statusCode === 200) {
			console.log(`subscription body: ${JSON.stringify(body)}`)
			if (_.size(body) > 0) {
				const scratch_id = await engine.getScratch(body.vehicle_id)
				if (body.vehicle_speed > task.params.speed) {
					if (_.size(scratch_id) > 0) {
						await engine.append(body.vehicle_id, 1)
					} else {
						await engine.set(body.vehicle_id, 1)
					}
					engine.callback(body, engine.db, engine.task_id)
				}
			}
		} else {
			return {
				statusCode: res.statusCode,
				message: res.statusMessage
			}
		}
	})
	// engine.subscribe(list, 'location', (_.keys(task.params))[0], task.params.speed)
	// return data
}

// 处理订阅的数据回调
const onTaskData = async (data, task_id) => {
	engine.log('Overspeed_alert:in TaskData')
	engine.log(`data: ${JSON.stringify(data)}`)
	if (_.size(data) > 0) {
		const scratch_id = await engine.getScratchId(data.vehicle_id)
		if (scratch_id !== null) {
			await engine.append(data.vehicle_id, 1)
		} else {
			await engine.set(data.vehicle_id, 1)
		}
	}
	const cb = engine.callback(data, task_id)
	if (cb && task === null) {
		const rs = await engine.unsubscribe(data.sub_id)
		const result = await engine.removeRuntimeByTaskId()
		if (rs.statusCode === 200 && result !== null) {
			engine.log('task was deleted and subscription was cancled')
		}
	} else {
		const duration_time = Date.now() - task.time
		if (duration_time >= 12 * 3600 * 1000) {
			const rs = await engine.unsubscribe(data.sub_id)
			const result = await engine.removeRuntimeByTaskId()
			if (rs.statusCode === 200 && result !== null) {
				engine.log('the existence of runtime exceed due duration_time, it will be recreated later')
			}
		}
	}
}

module.exports = {
	onParamDeclare,
	onTaskExec,
	onTaskData
}
