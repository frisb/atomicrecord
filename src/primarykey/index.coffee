path = require('path')

module.exports = class PrimaryKey
	constructor: (@database, @dataset, options = {}) ->	
		{encoder, factory, resolver} = options

		PrimaryKey.Encoder::[fnName] = fn for fnName, fn of encoder if encoder
		PrimaryKey.Factory::[fnName] = fn for fnName, fn of factory if factory
		PrimaryKey.Resolver::[fnName] = fn for fnName, fn of resolver if resolver

		@encoder = new PrimaryKey.Encoder(@)
		@factory = new PrimaryKey.Factory(@)
		@resolver = new PrimaryKey.Resolver(@)

	_fields: null
	
	getDirectoryFields: -> 
		[]

	getKeyFields: -> 
		['id']

	getIdName: -> 
		'id'

	getRootPath: -> 
		path.join('acidrecord', @database, @dataset)

	Object.defineProperties @::, 
		directoryFields: 
			get: -> 
				@getDirectoryFields()

		keyFields: 
			get: -> 
				@getKeyFields()

		idName: 
			get: -> 
				@getIdName()

		fields:
			get: ->
				if (@_fields is null)
					@_fields = {}
					@_fields[field] = 1 for field in @directoryFields.concat(@keyFields)

				@_fields

	@Encoder = require('./encoder')
	@Factory = require('./factory')
	@Resolver = require('./resolver')