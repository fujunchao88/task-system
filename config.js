const config = {
	mongodb: {
		dbHost: 'localhost',
		dbPort: 27017,
		dbName: 'task_system',
		result_tb: 'result',
		scratch_tb: 'scratch',
		task_tb: 'tasks',
		runtime_tb: 'runtime'
	},
	agenda: {
		MongoUrl: 'localhost:27017/task_system',
		timeout: 5000,
		definitions: ''
	},
	tracks: {
		url: 'http://localhost:3000/tracks',
		params: {},
	},
	millege: {
		url: 'http://localhost:3000/millege',
		params: {},
	},
	csv: {
		export_file: './public/csvFile.csv'
	},
	oss: {
		options: {
			region: 'oss-cn-qingdao',
			accessKeyId: 'LTAI1ZQo09BBqqkX',
			accessKeySecret: 'V0MYlgZCwXtolhemz70cfL0xZsLgFn',
			bucket: 'task-system',
		},
	}
}

module.exports = config
