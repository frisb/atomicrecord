MultiKeySerializer = require('./multikey')
UniKeySerializer = require('./unikey')

module.exports = class SerializerFactory
	constructor: (ActiveRecordPrototype) ->
		@multi = new MultiKeySerializer(ActiveRecordPrototype)
		@uni = new UniKeySerializer(ActiveRecordPrototype)

	get: (partition) ->
	  if partition then @multi else @uni