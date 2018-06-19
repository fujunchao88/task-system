const _ = require('lodash')
const moment = require('moment')
const mongoose = require('mongoose')
const MongoClient = require('mongodb').MongoClient

const connection = async (host, port, dbname) => {
	const client = await MongoClient.connect(`mongodb://${host}:${port}`)
	const db = client.db(dbname)
	return db
}

const saveTo_db = async (db, table, rs) => {
	await db.collection(table).insertOne(rs)
}

const close_db = async (client) => {
	await client.close()
}

const getValueByKey = async (db, table, key, task_id) => {
	const data = await db.collection(table).findOne({ key, task_id }, { projection: { value: 1, _id: 0 }})
	return data.value
}

const removeByKey = async (db, table, key, task_id) => {
	await db.collection(table).findOneAndDelete({ key, task_id })
}

const findTaskById = async (db, task_id) => {
	const task = await db.collection('tasks').findOne({ _id: mongoose.Types.ObjectId(task_id) })
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
	const task = await db.collection('tasks').findOne({ _id: mongoose.Types.ObjectId(task_id) })
	return task.params.formatValue
}

const isRuntimeExists = async (db, task) => {
	const runtime = await db.collection('runtimes').findOne({ name: `${task._id}` })
	if (_.size(runtime) > 0) {
		return true
	}
	return false
}

const getScratchId = async (db, task_id, key) => {
	const scratch = await db.collection('scratches').findOne({ task_id, key })
	if (scratch) {
		return scratch._id
	}
	return null
}

module.exports = {
	connection,
	saveTo_db,
	getValueByKey,
	removeByKey,
	close_db,
	queryByTime,
	findScriptNameById,
	getFormatByTaskId,
	isRuntimeExists,
	getScratchId,
	findTaskById
}
