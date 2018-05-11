const fs = require('fs')
const _ = require('lodash')
const Agenda = require('agenda')
const rp = require('request-promise')
const moment = require('moment')
const Excel = require('exceljs')
const jsb = require('json-schema-builder')
const Readable = require('stream').Readable

const config = require('../config')
const settings = require('../setting')
const util_mongodb = require('./util/mongodb/index')

let schema = {}
const connection_url = settings.agendaMongoUrl
const dbName = settings.dbName
const readable = new Stream()
const agenda = new Agenda({
	db: { address: connection_url, collection: dbName }
})
const reuslt_type = new Map([
	['csv', 0],
	['excel', 1],
	['pdf', 2],
	['raw', 3]
])

class engine {
	constructor({ commonParam: { time, time_period, export_format } }, typeValue, FormatValue, periodValue, notificationValue, alertValue ) {
		this.commonParam = {
			time,
			time_period,
			export_format,
		}

		this.typeValue = typeValue
		this.FormatValue = FormatValue
		this.periodValue = periodValue
		this.notificationValue = notificationValue
		this.alertValue = alertValue
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
			qs: key === 'tracks' ? config.tracks.params : config.millege.params,
			resolveWithFullResponse: true,
		}
		const { body } = await rp(options)
		return body
	}

	// content: [
	// 	{ tid: 'oi3jo1123', timestamp: 44878, lat: 111.66, lng: 55.44 }
	// 	{ tid: 'oi3jo1123', timestamp: 44878, lat: 111.66, lng: 55.44 }
	// ]
	async save(key, content, format) {
		const db = util_mongodb.connection()
		let data
		if (format === 'csv') {
			const wb = new Excel.Workbook()
			const ws = wb.addWorksheet('My Sheet')
			const header_arr = _.keys(content[0])
			for (let i = 0; i < header_arr.length; i += 1) {
				ws.getColumn(i).header = header_arr[i]
			}
			for(let i = 0; i < content.length; i += 1) {
				const value_arr = _.values(content[i])
				ws.addRows(value_arr)
			}
			const now_str = moment().format('YYYYMMDD_HHmm')
			await wb.csv.writeFile(`../public/${now_str}.csv`)
			const readable = fs.createReadStream(`../public/${now_str}.csv`)
			data = db.grid_read(readable)
		}
		const rs = {
			type: reuslt_type.get(format),
			data,
			task_rumtime_id: ''
		}
	}

	subscribe(key, ...params) {

	}

	get(key) {

	}

	append(key, data) {

	}

	del(key) {

	}

	log(...args) {

	}

	callback() {

	}
}

module.exports = engine
