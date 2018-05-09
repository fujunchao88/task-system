const qs = require('querystring')
const _ = require('lodash')
const rp = require('request-promise')
const { promisify } = require('util')
const { keyValues } = require('pythonic')
const { isValidDate } = require('util')
const settings = require('../setting')

const getCheckScriptFormatFuc = (scriptProperty, defaultScript = {}) => script => {
	if (!script.name || (scriptProperty && !script[scriptProperty])) {
		throw new Error(`expected request body to match {name${scriptProperty ? `, ${scriptProperty}` : ''}}`)
	}
	return _.assign(defaultScript, script)
}

const donotCheck = script => script 

const getAssercFuc = (assertOnCount, errOnName) => async(script, scripts) => 
	scripts.count({ name: script.name })
		.then(count => {
			if(!assertOnCount(count)) {
				throw new Error(errOnName(script.name))
			}
		})

const scriptAssertions = {
	alreadyExists: getAssercFuc(count => count > 0, name => `A script named "${name}" already exists`),
	notExists: getAssercFuc(count => count <= 0, name => `Did not find a script named "${name}"`),
	donotAssert: () => true
}

const defineScript = async({ name, url, method, cb} = {}, scripts, agenda) => {
	agenda.define(name, (script, done) => {
		const {attrs: { data }} = script
		let uri = url
		for (const [key, value] of keyValues(data.params)) {
			uri = uri.replace(`:${key}`, value)
		}
		const query = qs.stringify(data.query)
		if (query !== '') {
			uri += `?${query}`
		}

		Promise.race([
			new Promise((resolve, reject) => setTimeout(() => reject(new Error('TimeOutError')), settings.timeout)),
			rp({
				method: method || 'POST',
				uri,
				body: data.body,
				headers: data.headers || {},
				json: true
			})
		])
		.catch(err => {
			job.fail(err.message)
			return {error: err.message}
		})
		.then(result => {
			if (cb) {
				return rp({
					method: cb.method || 'POST',
					uri: cb.url,
					headers: cb.headers || {},
					body: {data: data.body, response: result},
					json: true
				})
			}
		})
		.catch(err => job.fail(`failure in cb: ${err.message}`))
		.then(() => done())

		await jobs.count({name})
			.then(count => count < 1 ? jobs.insert({ name, url, method, callback }) : jobs.update({ name }, { $set: { url, method, callback } }))

		return 'job defined'
	})
}



