const mongoose = require('mongoose')

const Scratch_Schema = new mongoose.Schema({
	task_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Task'
	},
	key: String,
	value: mongoose.Schema.Types.Mixed
})

mongoose.model('Scratch', Scratch_Schema)
