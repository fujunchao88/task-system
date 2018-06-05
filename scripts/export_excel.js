/* eslint-disable no-undef */
/* eslint-disable no-console */

function onParamDeclare() {
	return config.export_schema
}

// 指定任务逻辑
const onTaskExec = async () => {
	engine.log('Export_excel: in onTaskExec')
	const content = await engine.queryTable('tracks')
	engine.log(`content: ${JSON.stringify(content)}`)
	await engine.save('script_type', content, format)
}

module.exports = {
	onParamDeclare,
	onTaskExec
}

