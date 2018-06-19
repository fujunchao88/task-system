const fs = require('fs')
const Agenda = require('agenda')
const _ = require('lodash')
const { NodeVM } = require('vm2')

const util_mongodb = require('../engine/util/mongodb')
const config = require('../config')
const Engine = require('../engine/index')

const agenda = new Agenda({
	db: { address: config.mongodb.MongoUrl, collection: config.mongodb.runtime_tb }
})

const script_selector = async (task, script_name, format) => {
	let filePath = ''
	if (script_name === 'overspeed_alert') {
		filePath = './overspeed_alert.js'
	} else if (script_name === 'export_excel') {
		filePath = './export_excel.js'
	}
	const script_file = fs.readFileSync(filePath, { encoding: 'utf8' })
	const db = await util_mongodb.connection(config.mongodb.dbHost, config.mongodb.dbPort, config.mongodb.dbName)
	const engine = new Engine(task._id, db)
	const vm = new NodeVM({
		console: 'inherit',
		sandbox: {
			engine,
			util_mongodb,
			_,
			format
		},
		require: {
			external: true,
			builtin: ['*'],
		}
	})
	const exec_result = vm.run(`${script_file}`, '../engine/index.js')
	exec_result.onTaskExec()
}

// agenda.define('query available task to run as runtime', { priority: 'higest' }, async (job) => {
// 	const db = await util_mongodb.connection(config.mongodb.dbHost, config.mongodb.dbPort, config.mongodb.dbName)
// 	const task_arr = await util_mongodb.queryByTime(db, config.mongodb.task_tb)
// 	for (let i = 0; i < task_arr.length; i += 1) {
// 		const task = await util_mongodb.findTaskById(db, task_arr[i]._id)
// 		const format = await util_mongodb.getFormatByTaskId(db, task._id)
// 		const scriptNameOf_task = await util_mongodb.findScriptNameById(db, task)
// 		await script_selector(task, scriptNameOf_task, job, format)
// 	}
// 	await script_selector(job.attrs.data.task, job.attrs.data.scriptNameOf_task, job, job.attrs.data.format)
// })

agenda.on('ready', async (job) => {
	console.log('ready')
	const db = await util_mongodb.connection(config.mongodb.dbHost, config.mongodb.dbPort, config.mongodb.dbName)
	const task_arr = await util_mongodb.queryByTime(db, config.mongodb.task_tb)
	// console.log(`task_arr: ${JSON.stringify(task_arr)}`)
	if (task_arr.length > 0) {
		for (let i = 0; i < task_arr.length; i += 1) {
			const task = await util_mongodb.findTaskById(db, task_arr[i]._id)
			const format = await util_mongodb.getFormatByTaskId(db, task._id)
			const scriptNameOf_task = await util_mongodb.findScriptNameById(db, task)
			const isRuntime_exists = await util_mongodb.isRuntimeExists(db, task)
			console.log(`isRuntime_exists: ${isRuntime_exists}`)
			if (isRuntime_exists === false) {
				const runtime = agenda.create(`${task._id}`, { task, format, scriptNameOf_task })
				await script_selector(runtime.attrs.data.task, runtime.attrs.data.scriptNameOf_task, runtime.attrs.data.format)
				runtime.save(() => {
					console.log('successfully saved to database')
				})
				agenda.start()
			} else {
				agenda.stop()
			}
		}
	} else {
		agenda.every('2 minutes', 'query available task to run as runtime')
	}
})

agenda.on('complete', function(job) {
	console.log('Job %s finished', job.attrs.name)
})

module.exports = agenda
