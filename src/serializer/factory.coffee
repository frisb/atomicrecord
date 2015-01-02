MultiKeySerializer = require('./multikey')
UniKeySerializer = require('./unikey')

serializers = {}

module.exports = 
	create: (ActiveRecord) ->
		key = "#{ActiveRecord::database}:#{ActiveRecord::dataset}"
		serializer = serializers[key]

		if (!serializer)
			serializers[key] = serializer = 
				multi: new MultiKeySerializer(ActiveRecord)
				uni: new UniKeySerializer(ActiveRecord)

		if ActiveRecord.partition then serializer.multi else serializer.uni