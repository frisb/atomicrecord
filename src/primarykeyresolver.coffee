FDBoost = require('fdboost')()
path = require('path')

fdb = FDBoost.fdb
db = FDBoost.db
directories = {}

module.exports = class PrimaryKey
  _fieldExclusions: null

  @extend = (superConstructor) ->
    superConstructor extends @
  
  constructor: (@database, @dataset) ->
  
  getRootPath: ->
    path.join('acidrecord', @database, @dataset)
    
  getKeyFields: ->
    ['id']
    
  getDirectoryFields: ->
    []
    
  #getIdName: ->
    #'id'
    
  resolveDirectory: (obj, callback) ->
    directoryPath = @getRootPath()
    directoryPath = directoryPath.substr(1) if directoryPath.indexOf('/') is 0
    directoryPath += "/#{obj[field]}" for field in @fields
    
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
    (FDBoost.encoding.encode(record[field]) for field in @getKeyFields())
    
    
  encode: (obj, callback) ->  
    resolveDirectory obj, (directory) ->
      key = directory.pack(@resolveKey(obj))
      callback(key)
    
  decode: (directory, buffer, record = {}) ->
    
  Object.defineProperty @::, 'fields',
    get: ->
      if (_fieldExclusions is null)
        _fieldExclusions[field] = 1 for field in @getDirectoryFields().concat(@getKeyFields())
        
      _fieldExclusions
    
class CustomPK extends PrimaryKey
  getKeyFields: ->
    ['timestamp', 'id']
    
  getDirectoryFields: ->
    ['carrier']