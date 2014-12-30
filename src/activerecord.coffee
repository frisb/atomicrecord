AbstractRecord = require('./abstractrecord')
SerializerFactory = require('./serializer/factory')

#_INCREMENTAL = new Buffer(4)
#_INCREMENTAL.writeUInt32LE(1, 0)

module.exports = (options) ->
  throw new Error('No AcidRecord options specified.') unless options
  
  {fdb, database, dataset, partition, fields, primaryKey} = options

  throw new Error('Database name not specified.') unless database
  throw new Error('Dataset name not specified.') unless dataset
  
  FDBoost = require('fdboost')(fdb)
  fdb = FDBoost.fdb
  db = FDBoost.db

  PrimaryKey = require('./primarykey')
  primaryKey = new PrimaryKey(database, dataset, primaryKey)

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
  
  

  class ActiveRecord extends AbstractRecord(primaryKey.idName, fields)
    ###*
     * Creates a new Record instance
     * @class
     * @param {object} record Record object initializer.
     * @return {Record} a Record instance.
    ###
    constructor: (record) ->
      super()
      
      @setValue(src, val) for src, val of record if record

      idName = primaryKey.idName
      @[primaryKey.idName] = primaryKey.factory.generateId() unless (record && record[primaryKey.idName])

      # no id if record not null
    
    keySize: 0
    valueSize: 0
    partition: partition

    data: (dest, val) ->
      if (dest && typeof(val) is 'undefined')
        val = super(dest)
        
        if (dest isnt primaryKey.idName && val instanceof Buffer)
          val = FDBoost.encoding.decode(val)
          @data(dest, val)
          
        return val
        
      return super(dest, val)
     
    getValue: (src) ->
      val = super(src)
      val = primaryKey.factory.deserializeId(val) if src is primaryKey.idName
      val
        

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
    @finder = require('./finder')
    @primaryKey = primaryKey
    @serializer = getSerializer(@)

    @transactional = (func) -> 
      fdb.transactional(func)

    @doTransaction = (transaction, callback) -> 
      db.doTransaction(transaction, callback)

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