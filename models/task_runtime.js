const mongoose = require('mongoose')

const Task_Runtime_Schema = new mongoose.Schema({
	task_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Task'
	},
	status: Number,
	scratch: Object
})

mongoose.model('Task_Runtime', Task_Runtime_Schema)
