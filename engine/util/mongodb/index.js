const _ = require('underscore')
const mongodb = require('mongodb')
const helper = require('./helper.js')
const fibrous = require('brickyard/fibrous')

const db = module.exports = {}
const db_instance
const collections = []
const indexes = {}

db.default_db_callback = function (err /*, others*/ ) {
	if (err) {
		console.log(err)
	}
}
db.init = function () {
	const names = Array.prototype.slice.call(arguments, 0)
	collections = _.union(collections, names)
	if (db_instance) {
		fibrous.run(handle_request)
	}
}
db.ensureIndex = function (collection, field /*,option*/ ) {
	const key = collection + '.' + field
	if (indexes[key]) {
		return
	}
	indexes[key] = arguments
	if (db_instance) {
		fibrous.run(handle_request)
	}
}
db.get_next_sequence = function (name) {
	const ret = db.counters.fbsync.findAndModify({
		_id: name
	}, {
		seq: 1
	}, {
		$inc: {
			seq: 1
		}
	}, {
		new: true,
		upsert: true
	})
	return ret.seq
}

function new_collection(name) {
	const instance = db_instance.collection(name)
	helper.addHelperFunctions(instance)
	return instance
}

function handle_request() {
	if (collections.length) {
		console.log('init mongodb collections:', JSON.stringify(collections))
		for (const i in collections) {
			const name = collections[i]
			if (db[name]) {
				continue
			}
			db[name] = new_collection(name)
		}
		collections.length = 0
	}

	if (!_.isEmpty(indexes)) {
		const tasks = indexes
		indexes = {}
		for (const k in tasks) {
			const collection = tasks[k][0]
			const field = tasks[k][1]
			const option = tasks[k][2]
			console.debug('ensure index', collection, field, option || '')
			const index
			if (typeof (field) === 'string') {
				index = {}
				index[field] = 1
			} else {
				index = field
			}
			if (option) {
				db[collection].fbsync.createIndex(index, option)
			} else {
				db[collection].fbsync.createIndex(index)
			}
		}
	}
}

db.init('counters')

