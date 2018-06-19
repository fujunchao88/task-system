/* eslint-disable no-undef */
/* eslint-disable no-console */
const schema = {
	'type': 'object',
	'properties': {
		'script_id': { 'type': 'string'},
		'owner_id': { 'type': 'string' },
		'name': { 'type': 'string' },
		'time': { 'type': 'number'},
		'params': {
			'type': 'object',
			'properties': {
				'speed': {
					'type': 'number'
				},
				'typeValue': {
					'type': 'number'
				},
				'notificationValue': {
					'type': 'number'
				},
				'alertValue': {
					'type': 'number'
				},
			}
		}
	},
	'required': [
		'script_id',
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
	engine.log('Overspeed_alert: in TaskExec')
	const data = engine.subscribe('car_1, car_2', 120)
	return data
}

// 处理订阅的数据回调
const onTaskData = async (data, cb_key) => {
	engine.log('Overspeed_alert:in TaskData')
	engine.log(`data: ${JSON.stringify(data)}`)
	const task = await util_mongodb.findTaskById(engine.db, engine.task_id)
	const script_name = await util_mongodb.findScriptNameById(engine.db, task)
	if (_.size(data) > 0) {
		if (script_name === 'overspeed_alert') {
			const scratch_id = await util_mongodb.getScratchId(engine.db, engine.task_id, data.vehicle_ids)
			if (scratch_id !== null) {
				await engine.append(data.vehicle_ids, 1)
			} else {
				await engine.set(data.vehicle_ids, 1)
			}
		}
	}
	engine.callback(data, cb_key)		
}

module.exports = {
	onParamDeclare,
	onTaskExec,
	onTaskData
}
