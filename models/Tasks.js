const mongoose = require('mongoose')

const TaskSchema = new mongoose.Schema({
	script_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Script'
	},
	owner_id: String,
	name: String,
	time: Date,
	params: Object
}, {
	timestamps: { 
		createdAt: 'create_time',
		updatedAt: 'edit_time',
	}
})

mongoose.model('Task', TaskSchema)
