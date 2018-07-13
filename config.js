const config = {
	mongodb: {
		MongoUrl: 'localhost:27017/task_system',
		dbHost: 'localhost',
		dbPort: 27017,
		dbName: 'task_system',
	},
	oss: {
		options: {
			region: 'oss-cn-qingdao',
			accessKeyId: 'LTAI1ZQo09BBqqkX',
			accessKeySecret: 'V0MYlgZCwXtolhemz70cfL0xZsLgFn',
			bucket: 'task-system',
		},
	},
	myserver: {
		gateway: 'http://localhost:3000'
	},
	business_server: {
		gateway: 'http://219.131.223.238:8001',
		callback_url: 'http://localhost:3000/subscription_callback',
		mileage: '/vehicle/mileage',
		tracks: '/vehicle/location',
		status: '/vehicle/status'
	},
}

module.exports = config
