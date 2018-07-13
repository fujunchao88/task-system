const fs = require('fs')
const Agenda = require('agenda')
const request = require('request')
const _ = require('lodash')
const { NodeVM } = require('vm2')

const util_mongodb = require('../engine/util/mongodb')
const config = require('../config')
const Engine = require('../engine/index')

const agenda = new Agenda({
	db: { address: config.mongodb.MongoUrl, collection: 'runtimes' }
})
const period_type = new Map([
	[0, '1 hour'],
	[1, '1 day'],
	[2, '1 week'],
	[3, '1 month']
])

const script_loader = async (task, script_name, format) => {
	const filePath = `./${script_name}.js`
	const script_file = fs.readFileSync(filePath, { encoding: 'utf8' })
	const db = await util_mongodb.connection(config.mongodb.dbHost, config.mongodb.dbPort, config.mongodb.dbName)
	const engine = new Engine(task._id, db)
	const vm = new NodeVM({
		console: 'inherit',
		sandbox: {
			engine,
			task,
			config,
			request,
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

agenda.define('query available task to run as runtime', { priority: 'higest' }, async (job) => {
	const db = await util_mongodb.connection(config.mongodb.dbHost, config.mongodb.dbPort, config.mongodb.dbName)
	const task_arr = await util_mongodb.queryByTime(db)
	console.log(`task_arr: ${JSON.stringify(task_arr)}`)
	if (task_arr.length > 0) {
		for (let i = 0; i < task_arr.length; i += 1) {
			const task = await util_mongodb.findTaskById(db, task_arr[i]._id)
			const format = await util_mongodb.getFormatByTaskId(db, task._id)
			const scriptNameOf_task = await util_mongodb.findScriptNameById(db, task)
			const isRuntime_exists = await util_mongodb.isRuntimeExists(db, task)
			console.log(`isRuntime_exists: ${isRuntime_exists}`)
			if (isRuntime_exists === false) {
				const runtime = agenda.create(`${task._id}`, { task, format, scriptNameOf_task })
				if (scriptNameOf_task === 'export_excel') {
					runtime.repeatEvery(period_type[task.params.periodValue])
				}
				await script_loader(runtime.attrs.data.task, runtime.attrs.data.scriptNameOf_task, runtime.attrs.data.format)
				runtime.save(() => {
					console.log('successfully saved to database')
				})
			}
		}
	} else {
		console.log('no available task can be executed now')
	}
})

agenda.on('ready', async (job) => {
	console.log('ready')
	agenda.every('2 minutes', 'query available task to run as runtime')
	agenda.start()
})

agenda.on('complete', function(job) {
	console.log('Job %s finished', job.attrs.name)
})

module.exports = agenda
