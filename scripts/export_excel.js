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
				'data_type': {
					'type': 'string'
				},
				'time_type': {
					'type': 'string'
				},
				'periodValue': {
					'type': 'number'
				},
				'formatValue': {
					'type': 'number'
				},
				'start_time': {
					'type': 'number'
				},
				'end_time': {
					'type': 'number'
				}
			},
			'required': [
				'data_type',
				'periodValue',
				'formatValue',
				'start_time',
				'end_time'
			]
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
	engine.log('Export_excel: in onTaskExec')
	let list = null
	let time_type = null
	if (task.vehicles[0].type === 'vehicle_list') {
		list = _.split(task.vehicles[0].id_list, ',')
	}
	if (task.params.data_type === 'mileage') {
		time_type = task.params.time_type
	}
	const content = await engine.queryTable(task.params, list, time_type)
	engine.log(`content: ${JSON.stringify(content)}`)
	await engine.save('export', content, format)
}

module.exports = {
	onParamDeclare,
	onTaskExec
}

