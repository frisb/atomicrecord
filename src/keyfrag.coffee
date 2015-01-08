path = require('path')

{ObjectID} = require('bson')
FDBoost = require('fdboost')()

fdb = FDBoost.fdb
db = FDBoost.db
directories = {}

getDirectory = (dirPath, fnName, callback) ->
	directory = directories[dirPath]

	if (directory)
		callback(null, directory)
	else
		cb = (err, dir) ->
			if (err)
				callback(err)
			else
				directories[dirPath] = dir
				callback(null, dir)

		fdb.directory[fnName](db, dirPath.split('/'), {}, cb)

	return

module.exports = class KeyFrag
	constructor: (@database, @dataset, options) ->
		if (options)
			for prop, val of options
				KeyFrag::[prop] = val if typeof val is 'function'

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
		new Buffer(hexStr, 'hex')

	deserializeId: (buffer) ->
		buffer.toString('hex')

	getRootPath: -> 
		path.join('acidrecord', @database, @dataset)

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
			val = FDBoost.encoding.encode(val) unless field is idName
			key.push(val)

		key

	encodeKey: (directory, obj, keySuffix) ->  
		keyArr = @resolveKey(obj)
		keyArr = keyArr.concat(keySuffix) if keySuffix

		### Store key internally in record if obj is an ActiveRecord instance ###
		obj.key = keyArr if obj.__proto__.hasOwnProperty('key')

		directory.pack(keyArr)
    
	decodeKey: (directory, buffer, obj = {}) ->
		keyArr = directory.unpack(buffer)

		for i in [0...@keyFields.length]
			val = keyArr[i]
			val = FDBoost.encoding.decode(val) unless i is @keyFields.length - 1
			obj[@keyFields[i]] = val

		obj

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