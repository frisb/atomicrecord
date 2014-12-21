{ObjectID} = require('bson')
AbstractRecord = require('./abstractrecord')

DirectoryResolver = require('./resolvers/directory')
KeyResolver = require('./resolvers/key')

SerializerFactory = require('./serializer/factory')

#_INCREMENTAL = new Buffer(4)
#_INCREMENTAL.writeUInt32LE(1, 0)

module.exports = (options) ->
  throw new Error('No AcidRecord options specified.') unless options
  
  {fdb, database, dataset, idName, pkFactory, partition, keyFields, valueFields} = options
  
  idName ?= 'id'
  pkFactory ?= -> new Buffer(new ObjectID().toHexString(), 'hex')
  
  throw new Error('Database name not specified.') unless database
  throw new Error('Dataset name not specified.') unless dataset
  
  FDBoost = require('fdboost')(fdb)
  fdb = FDBoost.fdb
  db = FDBoost.db
  
  #KeyResolver = require('./keyresolver')
  
  directoryResolver = new DirectoryResolver(options)
  keyResolver = new KeyResolver(idName, keyFields)
  
  fieldExclusions = {}
  fieldExclusions[field] = 1 for field in directoryResolver.fields
  fieldExclusions[field] = 1 for field in keyResolver.fields
  
  serializer = null
  
  getSerializer = (ActiveRecordPrototype) ->
    if (serializer is null)
      serializerFactory = new SerializerFactory(ActiveRecordPrototype)
      serializer = serializerFactory.get(partition) 
      
    serializer
    
  save = (tr, record, callback) ->
    cb = (arr) ->
      tr.set(kv[0], kv[1]) for kv in arr
      record.reset(true)
      
      #rec.index(tr, directory, rec)
      #rec.increment(tr, directory, rec)
      
      callback(null)
    
    record.serialize(cb)
      
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
  
  class ActiveRecord extends AbstractRecord(idName, valueFields)
    @directoryResolver = directoryResolver
    @keyResolver = keyResolver
    @fieldExclusions = fieldExclusions
  
    @Finder = require('./finder')
    
    @deserialize = (directory, keyValuePairs, callback) ->
      getSerializer(@).deserialize(directory, keyValuePairs, callback)
  
    @transactional = (func) -> fdb.transactional(func)
    @doTransaction = (transaction, callback) -> db.doTransaction(transaction, callback)
    #@resolveDirectory = (query, callback) -> directoryResolver.resolve(query, callback)
  
    keySize: 0
    valueSize: 0
    partition: partition
    
    ###*
     * Creates a new Record instance
     * @class
     * @param {object} record Record object initializer.
     * @return {Record} a Record instance.
    ###
    constructor: (record) ->
      super()
      
      @setValue(src, val) for src, val of record if record
      @[idName] = pkFactory() unless (record && record[idName])
      
    data: (dest, val) ->
      if (dest && typeof(val) is 'undefined')
        val = super(dest)
        
        if (dest isnt idName && val instanceof Buffer)
          val = FDBoost.encoding.decode(val)
          @data(dest, val)
          
        return val
        
      return super(dest, val)
      
    resolveDirectory: (callback) ->
      directoryResolver.resolve(@, callback)
      
    save: (tr, callback) ->
      if (typeof(tr) is 'function')
        callback = tr
        tr = null
        
      fdb.future.create (futureCb) =>
        complete = (err) =>
          futureCb(err, @)
        
        transactionalSave(tr || db, @, complete)
      , callback
    
    serialize: (callback) ->
      getSerializer(ActiveRecord).serialize(@, callback)
        
    #index: -> throw new Error('not implemented')
    #add: -> throw new Error('not implemented')
      
    # static methods
    @count = ->
      throw new Error('not implemented')
    
    @findAll = (query, options = {}) ->
      options.nonTransactional = true
      options.snapshot = true
        
      @find(query, options)

    @find = require('./finder')
      
    Object.defineProperties @::,
      keyValueSize: 
        get: -> @keySize + @valueSize