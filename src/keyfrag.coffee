path = require('path')

{ObjectID} = require('bson')
FDBoost = require('fdboost')()

fdb = FDBoost.fdb
db = FDBoost.db
directories = {}

module.exports = class PrimaryKey
	constructor: (@database, @dataset, options) ->
		if (options)
			for prop, val of options
				PrimaryKey::[prop] = val if typeof val is 'function'

	_fields: null
	
	getDirectoryFields: -> 
		[]

	getKeyFields: -> 
		['id']

	getIdName: -> 
		'id'

	generateId: (record) -> 
		new Buffer(new ObjectID().toHexString(), 'hex')
		
	deserializeId: (buffer) ->
		buffer.toString('hex')

	getRootPath: -> 
		path.join('acidrecord', @database, @dataset)

	resolveDirectory: (obj, callback) ->
    directoryPath = @getRootPath()
    directoryPath = directoryPath.substr(1) if directoryPath.indexOf('/') is 0
    directoryPath += "/#{obj[field]}" for field in @directoryFields
    
    directory = directories[directoryPath]

    if (directory)
      callback(directory)
    else
      cb = (err, dir) ->
        directories[directoryPath] = dir
        callback(dir)
        
      fdb.directory.createOrOpen(db, directoryPath.split('/'), {}, cb)
    
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
    arr = @resolveKey(obj)
    arr = arr.concat(keySuffix) if keySuffix
    directory.pack(arr)
    
  decodeKey: (directory, buffer, obj = {}) ->
    arr = directory.unpack(buffer)

    for i in [0...@keyFields.length]
      val = arr[i]
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