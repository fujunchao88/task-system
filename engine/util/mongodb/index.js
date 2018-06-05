const _ = require('lodash')
const moment = require('moment')
const MongoClient = require('mongodb').MongoClient

const connection = async (host, port, dbname) => {
	const client = await MongoClient.connect(`mongodb://${host}:${port}`)
	const db = client.db(dbname)
	return db
}

const saveTo_db = async (db, table, rs) => {
	await db.collection(table).insertOne(rs)
}

const getValueByKey = async (db, table, key, task_id) => {
	const data = await db.collection(table).findOne({ key, task_id }, { projection: { value: 1, _id: 0 }})
	return data.value
}

const removeByKey = async (db, table, key, task_id) => {
	await db.collection(table).findOneAndDelete({ key, task_id })
}

const findLatest = async (db, table) => {
	const task = await db.collection(table).findOne({}, {
		limit: 1,
		sort: [['create_time', -1]],
	})
	return task._id
}

const findTaskById = async (db, task_id) => {
	const task = await db.collection('tasks').findOne({ _id: task_id })
	return task
}

const queryByTime = async (db, table) => {
	const arr = await db.collection(table).find({ time: { $lte: moment().unix() } }, { projection: { _id: 1, name: 1 }}).toArray()
	return arr
}

const findScriptNameById = async (db, task) => {
	const script = await db.collection('scripts').findOne({ _id: task.script_id })
	return script.name
}

const getFormatByTaskId = async (db, task_id) => {
	const task = await db.collection('tasks').findOne({ _id: task_id })
	return task.params.formatValue
}

module.exports = {
	connection,
	saveTo_db,
	getValueByKey,
	removeByKey,
	findLatest,
	queryByTime,
	findScriptNameById,
	getFormatByTaskId,
	findTaskById
}
