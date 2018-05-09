const { export_format } = engine.CommonParam

// 指定任务逻辑
function onTaskExec() {
    const format = engine.paramGet(export_format)
    const fleetId = engine.paramGet('Fleet Id')
    const content = engine.queryXXX(fleetId)
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
