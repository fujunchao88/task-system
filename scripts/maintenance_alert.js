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
				'time': {
					'type': 'number'
				},
				'mileage': {
					'type': 'number'
				},
				'engine': {
					'type': 'number'
				}
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
const onTaskExec = () => {
	setTimeout(onTaskExec, 15000)
	engine.log('Maintenance_alert: in TaskExec')
	let list = null
	if (task.vehicles[0].type === 'vehicle_list') {
		list = _.split(task.vehicles[0].id_list, ',')
	}
	const options = {
		url: `${config.business_server.gateway}/vehicle/status/latest`,
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
			if (_.size(body) > 0) {
				if (body.odometer >= task.params.mileage || body.engine_time >= task.params.engine || body.timestamp >= task.params.time) {
					console.log(`subscription body: ${JSON.stringify(body)}`)
					if (body.timestamp >= task.params.time) {
						body.type = 1
					}
					if (body.engine_time >= task.params.engine) {
						body.type = 3
					}
					if (body.odometer >= task.params.mileage) {
						body.type = 2
					}
					engine.callback(body)
				}
			}
		} else {
			return {
				statusCode: res.statusCode,
				message: res.statusMessage
			}
		}
	})
}

// 处理订阅的数据回调
const onTaskData = async (data, task_id) => {

}

module.exports = {
	onParamDeclare,
	onTaskExec,
	onTaskData
}
