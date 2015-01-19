MultiKeySerializer = require('./multikey')
UniKeySerializer = require('./unikey')

serializers = {}

module.exports = 
	create: (AtomicRecord) ->
		key = "#{AtomicRecord::database}:#{AtomicRecord::dataset}"
		serializer = serializers[key]

		if (!serializer)
			serializers[key] = serializer = 
				multi: new MultiKeySerializer(AtomicRecord)
				uni: new UniKeySerializer(AtomicRecord)

		if AtomicRecord.partition then serializer.multi else serializer.uni