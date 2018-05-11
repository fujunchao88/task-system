// const mongoose = require('mongoose')
const MongoClient = require('mongodb').MongoClient
const promifisy = require('util').promisify
const GridStore = require('mongodb').GridStore
const streamToBuffer = promifisy(require('stream-to-buffer'))
const config = require('../../../config')

const connection = async () => {
	// await mongoose.connect(`mongodb://${config.mongodb.dbHost}/${config.mongodb.dbName}`)
	await MongoClient.connect(`mongodb://${config.mongodb.dbHost}:${config.mongodb.dbPort}/${config.mongodb.dbName}`)
}

const grid_read = async (file_stream) => {
	const db = await connection()
	const grid_open = await new GridStore(db, 'r').open()
	const file_buff = await streamToBuffer(file_stream)
	await grid_open.read(file_buff)
}

const save = async (rs) => {
	const db = await connection()
	const collection = db.collection('result')
	await db.insert(collection)
}

module.exports = {
	connection,
	grid_read
}
