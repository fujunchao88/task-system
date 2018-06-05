const config = {
	mongodb: {
		dbHost: 'localhost',
		dbPort: 27017,
		dbName: 'task_system',
		result_tb: 'results',
		scratch_tb: 'scratchs',
		task_tb: 'tasks',
	},
	agenda: {
		MongoUrl: 'localhost:27017/task_system',
		timeout: 5000,
		definitions: ''
	},
	tracks: {
		url: 'http://localhost:3000/export_tracks',
		params: {},
	},
	millege: {
		url: 'http://localhost:3000/export_millege',
		params: {},
	},
	oss: {
		options: {
			region: 'oss-cn-qingdao',
			accessKeyId: 'LTAI1ZQo09BBqqkX',
			accessKeySecret: 'V0MYlgZCwXtolhemz70cfL0xZsLgFn',
			bucket: 'task-system',
		},
	},
	alert_schema: {
		'type': 'object',
		'properties': {
			'script_id': { 'type': 'string'},
			'owner_id': { 'type': 'string' },
			'name': { 'type': 'string' },
			'time': { 'type': 'number'},
			'params': {
				'type': 'object',
				'properties': {
					'speed': {
						'type': 'number'
					},
					'typeValue': {
						'type': 'number'
					},
					'notificationValue': {
						'type': 'number'
					},
					'alertValue': {
						'type': 'number'
					},
				}
			}
		},
		'required': [
			'script_id',
			'owner_id',
			'name',
			'time',
			'params'
		]
	},
	export_schema: {
		'type': 'object',
		'properties': {
			'script_id': { 'type': 'string'},
			'owner_id': { 'type': 'string' },
			'name': { 'type': 'string' },
			'time': { 'type': 'number'},
			'params': {
				'type': 'object',
				'properties': {
					'periodValue': {
						'type': 'number'
					},
					'formatValue': {
						'type': 'number'
					}
				}
			}
		},
		'required': [
			'script_id',
			'owner_id',
			'name',
			'time',
			'params'
		]
	},
	callback: {
		host: 'http://localhost',
		port: 3000,
		url: 'http://localhost:3000'
	}
}

module.exports = config
