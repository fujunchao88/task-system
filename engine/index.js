const fs = require('fs')
const _ = require('lodash')
const request = require('request')
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

class Engine {
	constructor(task_id, db) {
		this.task_id = task_id
		this.db = db
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

	async queryTable(params, vehicle_id_list, time_type) {
		const options = {
			method: 'GET',
			json: true,
			resolveWithFullResponse: true,
			useQuerystring: true,
		}
		if (params.data_type === 'tracks') {
			options.url = `${config.business_server.gateway}${config.business_server.tracks}`
			options.qs = {
				vehicle_id: vehicle_id_list
			}
		}
		if (params.data_type === 'mileage') {
			options.url = `${config.business_server.gateway}${config.business_server.mileage}`
			options.qs = {
				vehicle_id_list,
				type: time_type,
			}
			if (time_type === 'hour') {
				options.qs.start = moment(params.start_time * 1000).format('YYYYMMDDHH')
				options.qs.end = moment(params.end_time * 1000).format('YYYYMMDDHH')
			} else if (time_type === 'day') {
				options.qs.start = moment(params.start_time * 1000).format('YYYYMMDD')
				options.qs.end = moment(params.end_time * 1000).format('YYYYMMDD')
			} else if (time_type === 'month') {
				options.qs.start = moment(params.start_time * 1000).format('YYYYMM')
				options.qs.end = moment(params.end_time * 1000).format('YYYYMM')
			} else {
				options.qs.start = moment(params.start_time * 1000).format('YYYY')
				options.qs.end = moment(params.end_time * 1000).format('YYYY')
			}
		}
		if (params.data_type === 'status') {
			options.url = `${config.business_server.gateway}${config.business_server.status}`
			options.qs = {
				vehicle_id: vehicle_id_list
			}
		}
		console.log(`options: ${JSON.stringify(options)}`)
		const { body } = await rp(options)
		return body
	}

	// content = queryTable
	// content: [
	// 	{ vehicle_ids: 'oi3jo1123', timestamp: 44878, lat: 111.66, lng: 55.44 }
	// 	{ vehicle_ids: 'oi3jo1123', timestamp: 44878, lat: 111.66, lng: 55.44 }
	// ]
	async save(key, content, format) {
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
			data,
			create_time: Date.now(),
			task_id: this.task_id
		}
		await util_mongodb.saveTo_db(this.db, 'results', rs)
	}

	subscribe(vehicle_id_list, type, key, params) { // key为任务所需参数，params实际为任务所需参数的值，如：超速告警中判断是否超速的临界值
		const options = {
			url: `${config.business_server.gateway}/vehicle/subscription`,
			method: 'POST',
			body: {
				task_id: this.task_id,
				vehicle_id_list,
				type,
				callback_url: config.business_server.callback_url,
				// key,
				// params
			},
			json: true,
			resolveWithFullResponse: true
		}
		request(options, (err, res, body) => {
			if (err) {
				console.error(err)
			}
			if (res.statusCode === 200) {
				console.log(`subscription body: ${JSON.stringify(body)}`)
				return body
			} else {
				return {
					statusCode: res.statusCode,
					message: res.statusMessage
				}
			}
		})
	}

	async unsubscribe(sub_id) {
		const options = {
			url: `${config.business_server.gateway}/unsubscription`,
			method: 'POST',
			body: {
				task_id: this.task_id,
				sub_id
			},
			json: true,
			resolveWithFullResponse: true
		}
		const { statusCode, statusMessage, body } = await rp(options)
		if (statusCode === 200 && body) {
			console.log('subscription was cancled')
			return body
		} else {
			return {
				statusCode,
				statusMessage,
				body
			}
		}
	}

	async set(key, value) {
		const rs = {
			task_id: this.task_id,
			key,
			value
		}
		await util_mongodb.saveTo_db(this.db, 'scratches', rs)
	}

	async get(key) {
		await util_mongodb.getValueByKey(this.db, this.task_id, key)
	}

	async append(key, data) {
		const value = await util_mongodb.getValueByKey(this.db, 'scratches', key, this.task_id)
		await this.db.collection('scratches').findOneAndUpdate({ key, task_id: this.task_id }, { $set: {value: data + value }})
	}

	async update(key, value) {
		await util_mongodb.updateScratch(this.db, this.task_id, key, value)
	}

	async del(key) {
		await util_mongodb.removeByKey(this.db, 'scratches', key, this.task_id)
	}

	log(...args) {
		console.log(args)
	}

	async getScratch(key) {
		const scratch = await util_mongodb.getScratchId(this.db, this.task_id, key)
		if (scratch) {
			return scratch._id
		}
		return null
	}

	async removeRuntimeByTaskId() {
		await util_mongodb.removeRuntimeByTaskId(this.db, this.task_id)
	}

	async callback(data) {
		const task = await util_mongodb.findTaskById(this.db, this.task_id)
		const script_name = await util_mongodb.findScriptNameById(this.db, task)
		const options = {
			url: `${config.myserver.gateway}/callback/alert-event`,
			method: 'POST',
			json: true,
			resolveWithFullResponse: true,
		}
		if (script_name === 'overspeed_alert') {
			options.body = {
				task_id: this.task_id,
				vehicle_id: data.vehicle_id,
				speed: data.vehicle_speed,
				timestamp: data.timestamp,
				location: {
					lng: data.longitude,
					lat: data.latitude
				},
				extra: data.extra ? data.extra : {}
			}
		}
		if (script_name === 'fence_alert') {
			options.body = {
				task_id: this.task_id,
				vehicle_id: data.vehicle_id,
				type: data.type,
				timestamp: data.timestamp,
				location: {
					lng: data.longitude,
					lat: data.latitude
				},
				extra: data.extra ? data.extra : {}
			}
		}
		if (script_name === 'lowVoltage_alert') {
			options.body = {
				task_id: this.task_id,
				vehicle_id: data.vehicle_id,
				voltage: data.battery_voltage,
				timestamp: data.timestamp,
				extra: data.extra ? data.extra : {}
			}
		}
		if (script_name === 'maintenance_alert') {
			options.body = {
				task_id: this.task_id,
				vehicle_id: data.vehicle_id,
				type: data.type,
				timestamp: data.timestamp,
				extra: data.extra ? data.extra : {}
			}
		}
		request(options, function(err, res, body) {
			if (err) {
				console.error(err)
			}
			if (res.statusCode === 200) {
				console.log(`callback body: ${JSON.stringify(body)}`)
				return body
			} else {
				return {
					statusCode: res.statusCode,
					message: res.statusMessage
				}
			}
		})
	}
}

module.exports = Engine
