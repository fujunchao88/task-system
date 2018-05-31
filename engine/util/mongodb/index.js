const _ = require('lodash')
const MongoClient = require('mongodb').MongoClient
const promifisy = require('util').promisify
const GridStore = require('mongodb').GridStore
const streamToBuffer = promifisy(require('stream-to-buffer'))

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

module.exports = {
	connection,
	saveTo_db,
	getValueByKey,
	removeByKey,
	findLatest
}
