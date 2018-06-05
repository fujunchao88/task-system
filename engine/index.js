const fs = require('fs')
const _ = require('lodash')
const rp = require('request-promise')
const moment = require('moment')
const Excel = require('exceljs')
const jsb = require('json-schema-builder')
const OSS = require('ali-oss').Wrapper

const config = require('../config')
const util_mongodb = require('./util/mongodb/index')

let schema = {}
const client = new OSS({
	region: config.oss.options.region,
	accessKeyId: config.oss.options.accessKeyId,
	accessKeySecret: config.oss.options.accessKeySecret,
	bucket: config.oss.options.bucket
})
// const result_type = new Map([
// 	['csv', 0],
// 	['excel', 1],
// 	['pdf', 2],
// 	['raw', 3]
// ])
const callback_type = new Map([
	['overspeed', '/alert/overspeed'],
	['long_stay', '/alert/long_stay']
])

class Engine {
	constructor(task_id) {
		this.task_id = task_id
	}

	paramDeclare(name, type) {
		const result = jsb.type(type).json()
		schema[`${name}`] = result
	}

	paramRange(name, range) {
		if (typeof range[0] === 'number') {
			if (schema[`${name}`].type === 'number') {
				schema[`${name}`] = jsb.type('number').maximum(range[1]).exclusiveMaximum(true).json()
			}
			if (schema[`${name}`].type === 'string') {
				schema[`${name}`] = jsb.type('string').minLength(range[0]).maxLength(range[1]).json()
			}
		} else {
			schema[`${name}`] = jsb.object().property(_.keys(range)[0], _.values(range)[0]).json()
		}
	}

	paramOptional(name, isOPtional = true) {
		if (isOPtional) {
			return this.name
		}
		return {}
	}

	paramGet(name) {
		return this.name = name
	}

	async queryTable(key) {
		const options = {
			url: key === 'tracks' ? config.tracks.url : config.millege.url,
			method: 'GET',
			// qs: key === 'tracks' ? config.tracks.params : config.millege.params,
			json: true,
			resolveWithFullResponse: true,
		}
		const { body } = await rp(options)
		return body
	}

	// content = queryTable
	// content: [
	// 	{ vehicle_ids: 'oi3jo1123', timestamp: 44878, lat: 111.66, lng: 55.44 }
	// 	{ vehicle_ids: 'oi3jo1123', timestamp: 44878, lat: 111.66, lng: 55.44 }
	// ]
	async save(key, content, format) {
		const db = await util_mongodb.connection(config.mongodb.dbHost, config.mongodb.dbPort, config.mongodb.dbName)
		let data
		if (format === 0) {
			const now_str = moment().format('YYYYMMDD_HHmmss')
			const writable = fs.createWriteStream(`../public/${now_str}.csv`)
			const wb = new Excel.Workbook()
			const ws = wb.addWorksheet('My Sheet')
			const header_arr = _.keys(content[0])
			ws.addRow(header_arr).commit()
			for(let i = 0; i < content.length; i += 1) {
				const value_arr = _.values(content[i])
				ws.addRow(value_arr).commit()
			}
			await wb.csv.write(writable)
			const result = await client.put(`task_system/${now_str}.csv`, `../public/${now_str}.csv`)
			data = result.name
		}
		const rs = {
			type: format,
			// type: result_type.get(format),
			data,
			create_time: Date.now(),
			task_id: this.task_id
		}
		await util_mongodb.saveTo_db(db, config.mongodb.result_tb, rs)
		db.emit('close')
	}

	async subscribe(key, ...params) { // query为任务所需参数，params实际为任务所需参数的值，如：超速告警中判断是否超速的临界值
		// setTimeout(async () => {
		const options = {
			url: 'http://localhost:3000/subcribe/overspeed',
			method: 'GET',
			json: true,
			resolveWithFullResponse: true
		}
		const result = await rp(options)
		return result.body
		// }, 5000)
	}

	async set(key, value) {
		const db = await util_mongodb.connection(config.mongodb.dbHost, config.mongodb.dbPort, config.mongodb.dbName)
		const rs = {
			task_id: this.task_id,
			key,
			value
		}
		util_mongodb.saveTo_db(db, config.mongodb.scratch_tb, rs)
		db.emit('close')
	}

	async get(key) {
		const db = await util_mongodb.connection(config.mongodb.dbHost, config.mongodb.dbPort, config.mongodb.dbName)
		util_mongodb.getValueByKey(db, config.mongodb.scratch_tb, key, this.task_id)
		db.emit('close')
	}

	async append(key, data) {
		const db = await util_mongodb.connection(config.mongodb.dbHost, config.mongodb.dbPort, config.mongodb.dbName)
		const value = await util_mongodb.getValueByKey(db, config.mongodb.result_tb, key, this.task_id)
		await db.collection(config.mongodb.scratch_tb).findOneAndUpdate({ key, task_id: this.task_id }, { $set: {value: data + value }})
		db.emit('close')
	}

	async del(key) {
		const db = await util_mongodb.connection(config.mongodb.dbHost, config.mongodb.dbPort, config.mongodb.dbName)
		await util_mongodb.removeByKey(db ,config.mongodb.scratch_tb, key, this.task_id)
		db.emit('close')
	}

	log(...args) {
		console.log(args)
	}

	async callback(cb_key, data) {
		const options = {
			url: `${config.callback.url}${callback_type.get(cb_key)}`,
			method: 'POST',
			json: true,
			resolveWithFullResponse: true,
			body: {
				status: 200,
				message: 'Operation is successful',
				data
			}
		}
		const result = await rp(options)
		return result.body
	}
}

module.exports = Engine
