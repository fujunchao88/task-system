/* eslint-disable no-undef */
/* eslint-disable no-console */
const event = {}

function onParamDeclare() {
	return config.alert_schema
}

// 指定任务逻辑
const onTaskExec = async () => {
	engine.log('Overspeed_alert: in TaskExec')
	event.subscribeKey = 'speed'
	event.cbKey = 'overspeed'
	event.data = await engine.subscribe()
	return event
}

// 处理订阅的数据回调
const onTaskData = async (event, engine) => {
	engine.log('Overspeed_alert:in TaskData')
	engine.log(`event: ${JSON.stringify(event)}`)
	const matched_arr = []
	if (event.subscribeKey === 'speed') {
		for (let i = 0; i < event.data.length; i += 1) {
			if (event.data[i].speed > task.params.speed) {
				matched_arr.push(event.data[i])
			}
		}
		await engine.callback(event.cbKey, matched_arr)		
	}
}

module.exports = {
	onParamDeclare,
	onTaskExec,
	onTaskData
}
