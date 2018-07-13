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
				'radius': {
					'type': 'number'
				},
				'lng': {
					'type': 'number'
				},
				'lat': {
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

const getDistance = async ( lng1, lat1, lng2, lat2) => {
	const radLat1 = lat1 * Math.PI / 180
	const radLat2 = lat2 * Math.PI / 180
	const a = radLat1 - radLat2
	const  b = lng1 * Math.PI / 180 - lng2 * Math.PI / 180
	let s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a/2),2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b/2),2)))
	s = s * 6378.137 // EARTH_RADIUS
	s = Math.round(s * 10000) / 10000
	return s
}

// 指定任务逻辑
const onTaskExec = async () => {
	setTimeout(onTaskExec, 2000)
	engine.log('fence_alert: in TaskExec')
	let list = null
	if (task.vehicles[0].type === 'vehicle_list') {
		list = _.split(task.vehicles[0].id_list, ',')
	}
	const options = {
		url: `${config.business_server.gateway}/vehicle/location`,
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
			// console.log(`subscription body: ${JSON.stringify(body)}`)
			for (let ele of body) {
				ele.type = undefined
				if (ele.longitude && ele.latitude) {
					const distance = await getDistance(task.params.lng, task.params.lat, ele.longitude, ele.latitude)
					const scratch_id = await engine.getScratch(ele.vehicle_id)
					if (distance * 1000 <= task.params.radius) {
						engine.log(`distance: ${distance * 1000}`)
						if (scratch_id === null) {
							ele.type = 1
							await engine.set(ele.vehicle_id, ele.type)
						} else {
							const scratch_value = await engine.get(ele.vehicle_id)
							if (scratch_value === 1) {
								ele.type = 2
							} else {
								ele.type = 1
							}
							await engine.update(ele.vehicle_id, ele.type)
						}
						engine.log(`ele: ${JSON.stringify(ele)}`)
						await engine.callback(ele)
					}
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
}

module.exports = {
	onParamDeclare,
	onTaskExec,
	onTaskData
}
