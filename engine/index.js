const fs = require('fs')
const _ = require('lodash')
const Agenda = require('agenda')
const qs = require('querystring')
const _ = require('lodash')
const rp = require('request-promise')
const MyStream = require('json2csv-stream')

const config = require('../config')
const settings = require('../setting')
const db = require('./util/mongodb/index')

const type = config.type
const connection_url = settings.agendaMongoUrl
const dbName = settings.dbName
const agenda = new Agenda({
	db: { address: connection_url, collection: dbName }
})

class engine {
	constructor({ commonParam: { time, time_period, export_format } }, typeValue, FormatValue, periodValue, notificationValue, alertValue ) {
		this.commonParam = {
			time,
			time_period,
			export_format,
		}

		this.typeValue = typeValue
		this.formatTypeValue = formatTypeValue
		this.periodValue = periodValue
		this.notificationTypeValue = notificationTypeValue
		this.alertVTypeValue = alertVTypeValue
	}

	paramDeclare(name, type) {
		return this.name.constructor = type
	}

	paramRange(name, range) {
		if (name instanceof String) {
			(name.length >= _.head(range)) && (name.length <= _.last(range))
		}
		if (name instanceof Number) {
			(name.length >= _.head(range)) && (name.length <= _.last(range))
		}
		if (name instanceof Date) {
			(name >= _.head(range)) && (name <= _.last(range))
		}
	}

	paramOptional(name, true) {
		if (true) {
			return this.name
		}
		return {}
	}

	paramGet(name) {
		return this.name = name
	}

	async queryTable(type) {
		const options = {
			url: type === 'tracks' ? config.tracks.url:config.millege.url,
			method: 'GET',
			qs: type === 'tracks' ? config.tracks.params:config.millege.params,
			resolveWithFullResponse: true,
		}
		const { statusCode, body } = await rp(options)
		return JSON.parse(body)
	}

	save(key, content, format) {
		if (format === 'csv') {
			try {
				const json_file = fs.writeFileSync('../public/json_file.json', content, 'utf8')
				const 
			} catch (err) {
				console.error(err)
			}
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
