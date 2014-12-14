KeyValueRecord = require('./keyvaluerecord')
path = require('path')

directories = {}

_INCREMENTAL = new Buffer(4)
_INCREMENTAL.writeUInt32LE(1, 0)

module.exports = (options) ->
  throw new Error('No AcidRecord options specified.') unless options
  
  {fdb, database, dataset, rootPath, datasetPath} = options
  
  throw new Error('Database name not specified.') unless database
  throw new Error('Dataset name not specified.') unless dataset
  
  FDBoost = require('fdboost')(fdb)
  fdb = FDBoost.fdb
  db = FDBoost.db
  
  KeyResolver = require('./keyresolver')
  
  rootPath ?= "/acidrecord/#{database}"
  datasetPath ?= "/datasets/#{dataset}"
  
  getDirectory = (rec, callback) ->
    if (typeof(datasetPath) is 'function')
      directoryPath = path.join(rootPath, datasetPath(rec))
    else 
      directoryPath = path.join(rootPath, datasetPath)
    
    directory = directories[directoryPath]
    
    if (directory)
      callback(directory)
    else
      cb = (directory) ->
        directories[directoryPath] = directory
        callback(directory)
      
      fdb.createOrOpen(db, directoryPath.split('/'), {}, cb)
      
    return
  
  save = (tr, rec, callback) ->
    getDirectory rec, (directory) ->
      #process.nextTick ->
      tr.set(kv[0], kv[1]) for kv in rec.toKeyValues(directory)
      #rec.toKeyValues()
      rec.reset(true)
      
      #rec.index(tr, directory, rec)
      #rec.increment(tr, directory, rec)
      
      callback(null)
  
  #index: (tr, directory, rec) ->
    #for item in rec.index.items
      #if (!item.filter || item.filter(rec))
        ## no filter or successfully filtered
        #directory = rec.provider.dir[mechanism][item.name]
        #packedKey = directory.pack(KeyResolver.resolve(rec, item.key))
        #tr.set(packedKey, '')
        #
  #increment: (tr, directory, callback) ->
    #for item in rec.index.items
      #if (!item.filter || item.filter(rec))
        ## no filter or successfully filtered
        #directory = rec.provider.dir[mechanism][item.name]
        #packedKey = directory.pack(KeyResolver.resolve(rec, item.key))
        #tr.add(packedKey, _INCREMENTAL)
          
  transactionalSave = fdb.transactional(save)
  
  class Record extends KeyValueRecord(options)
    dataset: dataset
    
    save: (tr, callback) ->
      if (typeof(tr) is 'function')
        callback = tr
        tr = null
        
      fdb.future.create (futureCb) =>
        complete = (err) =>
          futureCb(err, @)
        
        transactionalSave(tr || @db, @, complete)
      , callback
        
    index: -> throw new Error('not implemented')
    add: -> throw new Error('not implemented')
      
    # static methods
    @count = ->
      throw new Error('not implemented')
    
    @findAll = ->
      throw new Error('not implemented')

    @find = ->
      throw new Error('not implemented')