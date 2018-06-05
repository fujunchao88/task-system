const fs = require('fs')
const Agenda = require('agenda')
const { NodeVM } = require('vm2')

const util_mongodb = require('../engine/util/mongodb')
const config = require('../config')
const Engine = require('../engine/index')

const agenda = new Agenda({
	db: { address: config.agenda.MongoUrl, collection: config.mongodb.runtime_tb }
})

agenda.define('runtime_overspeed', { priority: 'high' }, async (job) => {
	const script_file = fs.readFileSync('./overspeed_alert.js', { encoding: 'utf8' })
	const engine = new Engine((job.attrs.data.task)._id)
	const vm = new NodeVM({
		console: 'inherit',
		sandbox: {
			engine,
			task: job.attrs.data.task,
			config
		},
		require: {
			external: true,
			builtin: ['*'],
		}
	})
	const exec_result = vm.run(`${script_file}`, '../engine/index.js')
	const event = await exec_result.onTaskExec()
	if (event.data.length > 0) {
		await exec_result.onTaskData(event, engine)
	}
	job.save(() => {
		engine.log('successfully saved to database')
	})
})

agenda.define('runtime_export', { priority: 'high' }, async (job) => {
	const script_file = fs.readFileSync('./export_excel.js', { encoding: 'utf8' })
	const engine = new Engine((job.attrs.data.task)._id)
	const vm = new NodeVM({
		console: 'inherit',
		sandbox: {
			engine,
			format: job.attrs.data.format,
			task: job.attrs.data.task,
			config,
			util_mongodb
		},
		require: {
			external: true,
			builtin: ['*'],
		}
	})
	const exec_result = vm.run(`${script_file}`, '../engine/index.js')
	await exec_result.onTaskExec()
	job.save(() => {
		engine.log('successfully saved to database')
	})
})

agenda.define('query available task to run as runtime', { priority: 'higest' }, async (job) => {
	const db = await util_mongodb.connection(config.mongodb.dbHost, config.mongodb.dbPort, config.mongodb.dbName)
	const task_arr = await util_mongodb.queryByTime(db, config.mongodb.task_tb)
	for (let i = 0; i < task_arr.length; i += 1) {
		const task = await util_mongodb.findTaskById(db, task_arr[i]._id)
		const format = await util_mongodb.getFormatByTaskId(db, task._id)
		const scriptNameOf_task = await util_mongodb.findScriptNameById(db, task)
		if (scriptNameOf_task === 'overspeed_alert') {
			agenda.now('runtime_overspeed', { task })
		}
		if (scriptNameOf_task === 'export_excel') {
			agenda.now('runtime_export', { task, format })
		}
	}
})

agenda.on('ready', () => {
	console.log('ready')
	agenda.now('query available task to run as runtime')
	// agenda.every('2 minutes', 'query available task to run as runtime')
	agenda.start()
})

agenda.on('success:query available task to run as runtime', (job) => {
	console.log('run task Successfully to: %s', JSON.stringify(job))
})

agenda.on('fail:query available task to run as runtime', (err, job) => {
	console.log('Job failed with error: %s', err.message)
})

module.exports = agenda
