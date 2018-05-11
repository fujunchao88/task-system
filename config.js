const config = {
	mongodb: {
		dbHost: 'localhost',
		dbPort: 27017,
		dbName: 'task_system'
	},
	tracks: {
		url: 'http://172.16.0.220:6666/tracks',
		params: {

		},
	},
	millege: {
		url: 'http://172.16.0.220:7777/millege',
		params: {

		},
	},
	csv: {
		export_file: './public/csvFile.csv'
	}
}

module.exports = config
