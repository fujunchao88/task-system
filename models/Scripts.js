const mongoose = require('mongoose')

const ScriptSchema = new mongoose.Schema({
	owner_id: String,
	name: String,
	script: String
}, {
	timestamps: { 
		createdAt: 'create_time',
		updatedAt: 'edit_time',
	}
})

mongoose.model('Script', ScriptSchema)
