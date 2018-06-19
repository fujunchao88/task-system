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
				'periodValue': {
					'type': 'number'
				},
				'formatValue': {
					'type': 'number'
				}
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
const onTaskExec = async () => {
	engine.log('Export_excel: in onTaskExec')
	const content = await engine.queryTable('tracks')
	engine.log(`content: ${JSON.stringify(content)}`)
	await engine.save('script_type', content, format)
	return {}
}

module.exports = {
	onParamDeclare,
	onTaskExec
}

