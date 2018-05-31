const mongoose = require('mongoose')

const Result_Schema = new mongoose.Schema({
	task_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Task'
	},
	type: Number,
	data: Object
}, {
	timestamps: { 
		createdAt: 'create_time',
	}
})

mongoose.model('Result', Result_Schema)
