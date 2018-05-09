let dbname = process.env.DB_NAME || 'asyncTask'
let dbhost = process.env.DB_HOST || 'localhost'
let definitions = 'task_runtime_Definitions'
let timeout = 5000

const settings = {
	get agendaMongoUrl() {
		return `mongodb://${dbHost}/${dbName}`
	},
	get dbName() {
		return dbname
	},
	set dbName(value) {
		dbname = value
	},
	get dbHost() {
		return dbhost
	},
	set dbHost(value) {
		dbhost = value
	},
	get definitions() {
		return definitions
	},
	set definitions(value) {
		definitions = value
	},
	get timeout() {
		return timeout
	},
	set timeout(value) {
		timeout = value
	},
}

module.exports = settings
