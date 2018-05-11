const Ajv = require('ajv')

const engine = require('../engine/index.js')

const ajv = new Ajv()
const { export_format } = engine.CommonParam
const schema =  {
	'type': 'object',
	'title': 'Comment',
	'properties': {
		'tid': {
			'type': 'string'
		},
		'last_locations': {
			'type': 'object',
			'properties': {
				'lat': {
					'type': 'number'
				},
				'lng': {
					'type': 'number'
				}
			}
		},
		'present_locations': {
			'type': 'object',
			'properties': {
				'lat': {
					'type': 'number'
				},
				'lng': {
					'type': 'number'
				}
			}
		}
	},
	'required': [
		'tid',
		'last_locations',
		'present_locations'
	]
}

function onParamDeclare() {
	return schema
}

// 指定任务逻辑
function onTaskExec() {
	const format = engine.paramGet(export_format)
	const scipt_type = engine.paramGet('script_type')
	const content = engine.queryTable(scipt_type)
	const valid = ajv.validate(schema, content)
	engine.save(fleetId, content, format)
}

// 处理订阅的数据回调
function onTaskData(event) {
	const fleetId = engine.paramGet('Fleet Id')
	if (event.subscribeKey === 'geo' && event.data > 120) {
		engine.alert(engine.AlertType.OverSpeed, event.data, fleetId)
	} else if (event.subscribeKey === 'fence_event') {
		engine.alert(engine.AlertType.FenceEvent, event.data, fleetId)
	}
}
