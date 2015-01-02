{ObjectID} = require('bson')

module.exports = class Factory
	constructor: (@primaryKey) ->

	generateId: (record) -> 
		new Buffer(new ObjectID().toHexString(), 'hex')
		
	deserializeId: (buffer) ->
		buffer.toString('hex')