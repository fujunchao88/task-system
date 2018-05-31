const fs = require('fs')
const Agenda = require('agenda')
const { NodeVM } = require('vm2')

const util_mongodb = require('../engine/util/mongodb')
const config = require('../config.js')
const Engine = require('../engine/index.js')

const agenda = new Agenda({
	db: { address: config.agenda.MongoUrl, collection: config.mongodb.runtime_tb }
})
// `runtime_${Math.floor(Math.random() * 1000)}`
agenda.define('runtime_overspeed', { priority: 'high' }, async (job) => {
	const script_file = fs.readFileSync('./overspeed_alert.js', { encoding: 'utf8' })
	const db = await util_mongodb.connection(config.mongodb.dbHost, config.mongodb.dbPort, config.mongodb.dbName)
	const task_id = await util_mongodb.findLatest(db, config.mongodb.task_tb)
	const engine = new Engine({ commonParam: { time: 123, time_period: 7, export_format: 0 }}, 'String', 'CSV', 'Everyweek', 'Push', 'OverSpeed', task_id)
	const vm = new NodeVM({
		console: 'inherit',
		sandbox: {
			engine
		},
		require: {
			external: true,
			builtin: ['*'],
		}
	})
	vm.run(`
		${script_file}
	`, '../engine/index.js')
	job.save(() => {
		console.log('successfully saved to database')
	})
})

agenda.define('runtime_export', { priority: 'high' }, async (job) => {
	const script_file = fs.readFileSync('./export_excel.js', { encoding: 'utf8' })
	const db = await util_mongodb.connection(config.mongodb.dbHost, config.mongodb.dbPort, config.mongodb.dbName)
	const task_id = await util_mongodb.findLatest(db, config.mongodb.task_tb)
	const engine = new Engine({ commonParam: { time: 123, time_period: 7, export_format: 0 }}, 'String', 'csv', 'Everymonth', 'Push', 'OverSpeed', task_id)
	const vm = new NodeVM({
		console: 'inherit',
		sandbox: {
			engine
		},
		require: {
			external: true,
			builtin: ['*'],
		}
	})
	vm.run(`
		${script_file}
	`, '../engine/index.js')
	job.save(() => {
		console.log('successfully saved to database')
	})
	
})

agenda.on('ready', () => {
	console.log('ready')
	// agenda.now('runtime_overspeed')
	agenda.now('runtime_export')
	agenda.start()
})

agenda.on('success:runtime_one', (job) => {
	console.log('run task Successfully to: %s', JSON.stringify(job))
})

agenda.on('fail:runtime_one', (err, job) => {
	console.log('Job failed with error: %s', err.message)
})

module.exports = agenda
