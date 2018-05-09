const mongodb = require('mongodb')

function findById(id, cb) {
	return this.findOne({
		_id: toObjectID(id)
	}, cb)
}

function updateById(id, query, cb) {
	return this.updateOne({
		_id: toObjectID(id)
	}, query, cb)
}

function removeById(id, cb) {
	return this.deleteOne({
		_id: toObjectID(id)
	}, cb)
}

function addHelperFunctions(collection) {
	collection.findById = findById
	collection.updateById = updateById
	collection.removeById = removeById
}

function toObjectID(hex) {
	if (hex instanceof mongodb.ObjectID) {
		return hex
	}
	if (!hex || hex.length !== 24) {
		return hex
	}
	return mongodb.ObjectID.createFromHexString(hex)
}

module.exports.addHelperFunctions = addHelperFunctions
module.exports.toObjectID = toObjectID
