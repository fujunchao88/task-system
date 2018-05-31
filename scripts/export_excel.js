const Ajv = require('ajv')

const util_mongodb = require('../engine/util/mongodb')
const Engine = require('../engine/index.js')
const config = require('../config')

const ajv = new Ajv()
const schema =  {
	'type': 'object',
	'properties': {
		'vehicle_ids': {
			'type': 'string'
		},
		'timestamp': {
			'type': 'number'
		},
		'lng': {
			'type': 'number',
		},
		'lat': {
			'type': 'number',
		}
	},
	'required': [
		'vehicle_ids',
		'timestamp',
		'lat',
		'lng'
	]
}

function onParamDeclare() {
	return schema
}

// 指定任务逻辑
const onTaskExec = async () => {
	const db = await util_mongodb.connection(config.mongodb.dbHost, config.mongodb.dbPort, config.mongodb.dbName)
	const task_id = await util_mongodb.findLatest(db, config.mongodb.task_tb)
	const engine = new Engine({ commonParam: { time: 123, time_period: 7, export_format: 0 }}, 'String', 'csv', 'Everyweek', 'Push', 'OverSpeed', task_id)
	const format = engine.FormatValue
	const content = await engine.queryTable('tracks')
	console.log(`content: ${JSON.stringify(content)}`)
	for (let i = 0; i < content.length; i += 1) {
		const valid = ajv.validate(schema, content[i])
		if (!valid) throw new Error('invalid data schema')
	}
	await engine.save('script_type', content, format)
}

// 处理订阅的数据回调
// function onTaskData(event) {
	
// }

onTaskExec()

