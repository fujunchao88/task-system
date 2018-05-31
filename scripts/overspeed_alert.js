const Ajv = require('ajv')
const Engine = require('../engine/index.js')
const util_mongodb = require('../engine/util/mongodb')
const config = require('../config')

const ajv = new Ajv()
const schema =  {
	'type': 'object',
	'properties': {
		'vehicle_ids': {
			'type': 'string'
		},
		'speed': {
			'type': 'number'
		},
		'position': {
			'type': 'object',
			'properties': {
				'lat': { 'type': 'number' },
				'lng': { 'type': 'number' },
				'address': { 'type': 'string' },
				'location_time': { 'type': 'number' }
			}
		},
	},
	'required': [
		'vehicle_ids',
		'speed',
		'position'
	]
}

function onParamDeclare() {
	return schema
}

// 指定任务逻辑
const onTaskExec = async () => {
	console.log('in TaskExec')
	const db = await util_mongodb.connection(config.mongodb.dbHost, config.mongodb.dbPort, config.mongodb.dbName)
	const task_id = await util_mongodb.findLatest(db, config.mongodb.task_tb)
	const engine = new Engine({ commonParam: { time: 123, time_period: 7, export_format: 0 }}, 'String', 'CSV', 'Everyweek', 'Push', 'OverSpeed', task_id)
	const event = {}
	event.subscribeKey = 'speed'
	event.cbKey = 'overspeed'
	event.data = await engine.subscribe()
	console.log(`event.data: ${JSON.stringify(event.data)}`)
	const valid = ajv.validate(schema, event.data)
	if (!valid) {
		throw new Error('invalid data schema')
	}
	onTaskData(event, engine)
}

// 处理订阅的数据回调
const onTaskData = async (event, engine) => {
	console.log('in TaskData')
	if (event.subscribeKey === 'speed' && event.data.speed > 20) {
		await engine.callback(event.cbKey, event.data)
	}
}

onTaskExec()

// module.exports = {
// 	onParamDeclare,
// 	onTaskExec,
// 	onTaskData
// }
