path = require('path')

{ObjectID} = require('bson')

fdb = require('fdboost')()
db = fdb.open()
ID = require('./id')

module.exports = (database, dataset, overrides) ->
	directories = {}

	getDirectory = (dirPath, fnName, callback) ->
		directory = directories[dirPath]

		if (directory)
			callback(null, directory)
		else
			cb = (err, dir) ->
				if (err)
					err.message = "Directory path \"#{dirPath}\" does not exist." if err.message is 'The directory does not exist.'
					callback(err)
				else
					directories[dirPath] = dir
					callback(null, dir)

			fdb.directory[fnName](db, dirPath.split('/'), {}, cb)

		return

	class KeyFrag
		constructor: ->
			if (overrides)
				for prop, val of overrides
					KeyFrag::[prop] = val if typeof val is 'function'

		database: database
		dataset: dataset

		_fields: null
		
		getDirectoryFields: -> 
			[]

		getKeyFields: -> 
			['id']

		getIdName: ->
			'id'

		generateId: -> 
			@serializeId(new ObjectID().toHexString())

		serializeId: (hexStr) ->
			new ID(hexStr)

		deserializeId: (id) ->
			id.toString()

		getRootPath: -> 
			path.join('atomicrecord', @database, @dataset)

		getDirectoryPath: (obj) ->
			dirPath = @getRootPath()
			dirPath = dirPath.substr(1) if dirPath.indexOf('/') is 0
			dirPath += "/#{obj[field]}" for field in @directoryFields
			dirPath

		resolveDirectory: (obj, callback) ->
			getDirectory(@getDirectoryPath(obj), 'open', callback)
			return

		resolveOrCreateDirectory: (obj, callback) ->
			getDirectory(@getDirectoryPath(obj), 'createOrOpen', callback)
			return

		resolveKey: (obj) ->
			key = []
			idName = @getIdName()

			for field in @keyFields
				val = obj[field]
				val = fdb.encoding.encode(val) unless field is idName
				key.push(val)

			key

		encodeKey: (directory, obj, keySuffix) ->  
			keyArr = @resolveKey(obj)
			keyArr = keyArr.concat(keySuffix) if keySuffix

			### Store key internally in record if obj is an ActiveRecord instance ###
			obj.key = keyArr if obj.__proto__.hasOwnProperty('key')

			directory.pack(keyArr)
	    

	  # rethink this
		decodeKey: (directory, buffer, obj) -> # obj = {}) ->
			keyArr = directory.unpack(buffer)

			for i in [0...@keyFields.length]
				val = keyArr[i]
				val = fdb.encoding.decode(val) unless i is @keyFields.length - 1
				obj[@keyFields[i]] = val

			# obj
			return

		decodeDirectory: (directory, obj) ->
			start = directory._path.length - @directoryFields.length
			obj[@directoryFields[i - start]] = directory._path[i] for i in [start...directory._path.length]
			return

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

	new KeyFrag()