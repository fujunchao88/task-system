const mongoose = require('mongoose')
const moment = require('moment')

const ScriptSchema = new mongoose.Schema({
	owner_id: String,
	name: String,
	create_time: {
		type: Date,
		default: Date.now
	},
	edit_time: {
        type: Date,
        default: Date.now
    },
	script: String
}, {
	timestamps: { 
        createdAt: 'create_time',
        updatedAt: 'edit_time',
    }
})

mongoose.model('Script', ScriptSchema)
