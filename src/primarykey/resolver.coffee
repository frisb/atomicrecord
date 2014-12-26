FDBoost = require('fdboost')()

fdb = FDBoost.fdb
db = FDBoost.db
directories = {}

module.exports = class Resolver
	constructor: (@primaryKey) ->

	resolveDirectory: (obj, callback) ->
    directoryPath = @primaryKey.getRootPath()
    directoryPath = directoryPath.substr(1) if directoryPath.indexOf('/') is 0
    directoryPath += "/#{obj[field]}" for field in @primaryKey.directoryFields
    
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
    idName = @primaryKey.getIdName()

    for field in @primaryKey.keyFields
      val = obj[field]
      val = FDBoost.encoding.encode(val) unless field is idName
      key.push(val)

    key