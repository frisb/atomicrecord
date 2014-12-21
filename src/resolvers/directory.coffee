FDBoost = require('fdboost')()
path = require('path')

fdb = FDBoost.fdb
db = FDBoost.db
cache = {}

module.exports = class DirectoryResolver
  rootPath: null
  fields: null

  constructor: (options) ->
    {database, dataset, directoryFields, rootPath} = options
    
    @rootPath = path.join(rootPath || 'acidrecord', database, dataset)
    @rootPath = @rootPath.substr(1) if @rootPath.indexOf('/') is 0
    
    @fields = directoryFields || []

  getDirectory: (directoryPath, callback) ->
    directory = cache[directoryPath]
    
    if (directory)
      callback(directory)
    else
      cb = (err, dir) ->
        cache[directoryPath] = dir
        callback(dir)
        
      fdb.directory.createOrOpen(db, directoryPath.split('/'), {}, cb)
      
    return

  resolve: (obj, callback) ->
    directoryPath = @rootPath
    directoryPath += "/#{obj[field]}" for field in @fields
    @getDirectory(directoryPath, callback)
    return