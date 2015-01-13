AbstractRecord = require('./abstractrecord')

#_INCREMENTAL = new Buffer(4)
#_INCREMENTAL.writeUInt32LE(1, 0)

###*
 * Create an ActiveRecord class 
 * @method
 * @param {object} options ActiveRecord type specific options.
 * @param {object} [options.fdb=undefined] fdb API instance.
 * @param {string} options.database Database name.
 * @param {string} options.dataset Data collection name.
 * @param {Boolean} options.partition Flag if ActiveRecord type instance storage is partitioned.
 * @param {string[]|object} options.fields AliasMap initializer.
 * @param {object} [options.primaryKey] Override methods for keyfrag Primary Key generator.
 * @return {ActiveRecord} an ActiveRecord class
###    
module.exports = (options) ->
  throw new Error('No AcidRecord options specified.') unless options
  
  {fdb, database, dataset, partition, fields, primaryKey, indexes} = options

  throw new Error('Database name not specified.') unless database
  throw new Error('Dataset name not specified.') unless dataset
  
  FDBoost = require('fdboost')(fdb)
  fdb = FDBoost.fdb
  db = FDBoost.db

  ActiveIndex = require('./activeindex')
  KeyFrag = require('./keyfrag')
  SerializerFactory = require('./serializer/factory')

  keyFrag = new KeyFrag(database, dataset, primaryKey)

  activeIndexes = 
    names: []

  for indexName, index of indexes
    Index = ActiveIndex(indexName, index)
    activeIndexes[indexName] = new Index()
    activeIndexes.names.push(indexName)

  save = (tr, record, callback) ->
    cb = (err, arr) ->
      if (err)
        callback(err)
      else
        tr.set(kv[0], kv[1]) for kv in arr
        record.reset(true)
        
        # record.index(tr, callback)
        #rec.increment(tr, directory, rec)
        
        callback(null)
    
    record.serialize(cb)
  
  index = (tr, record, callback) ->
    cb = (err, directory) ->
      if (err)
        callback(err)
      else
        activeIndexes[indexName].execute(tr, directory, record) for indexName in activeIndexes.names
        callback(null)

    keyFrag.resolveDirectory(record, cb)

  #increment: (tr, directory, callback) ->
    #for item in rec.index.items
      #if (!item.filter || item.filter(rec))
        ## no filter or successfully filtered
        #directory = rec.provider.dir[mechanism][item.name]
        #packedKey = directory.pack(KeyResolver.resolve(rec, item.key))
        #tr.add(packedKey, _INCREMENTAL)
          
  transactionalSave = fdb.transactional(save)
  transactionalIndex = fdb.transactional(index)

  class ActiveRecord extends AbstractRecord(keyFrag.idName, fields)
    ###*
     * Creates a new typed ActiveRecord instance
     * @class
     * @param {object} [record] Record object initializer.
     * @return {Record} a typed ActiveRecord instance.
    ###
    constructor: (record) ->
      super()
      
      if (record)
        for src, val of record
          if (src is keyFrag.idName)
            @[src] = keyFrag.serializeId(val)
          else
            @[src] = val

    ### Initializers ###
    database: database
    dataset: dataset
    keySize: 0
    valueSize: 0
    partition: partition

    _key: null
    _keyValueSize: null

    ###*
     * Get / Set internal value for property alias.
     * @virtual
     * @param {string} dest Destination property alias.
     * @param {object} val Optional value to set.
     * @return {object} Value if val undefined.
    ###  
    data: (dest, val) ->
      if (dest && typeof(val) is 'undefined')
        val = super(dest)
        
        ### Decode the value if the dest param is not equal to keyFrag.idName and the type of val is Buffer ###
        if (dest isnt keyFrag.idName && val instanceof Buffer)
          val = FDBoost.encoding.decode(val)
          @data(dest, val)
          
        return val
        
      return super(dest, val)

    # ###*
    #  * Get value for property name.
    #  * @virtual
    #  * @param {string} src Source property name.
    #  * @return {object} Value.
    # ###   
    # getValue: (src) ->
    #   val = super(src)

    #   ### Deserialize the internal value using the unique identifier serlializer if the src param name is equal to keyFrag.idName ###
    #   val = keyFrag.deserializeId(val) if src is keyFrag.idName
    #   val

    ###*
     * The callback format for the save method
     * @callback saveCallback
     * @param {Error} err An error instance representing the error during the execution.
     * @param {ActiveRecord} record The current ActiveRecord instance if the save method was successful.
    ###

    ###*
     * Persists all property changes to the database
     * @method
     * @param {object} [tr=null] Transaction.
     * @param {saveCallback} callback Calback.
     * @return {Future}
    ###
    save: (tr, callback) ->
      if (typeof(tr) is 'function')
        callback = tr
        tr = null
        
      fdb.future.create (futureCb) =>
        transactionalSave(tr || db, @, futureCb)
      , callback

    index: (tr, callback) ->
      if (typeof(tr) is 'function')
        callback = tr
        tr = null
        
      fdb.future.create (futureCb) =>
        transactionalIndex(tr || db, @, futureCb)
      , callback

    serialize: (callback) ->
      ### generate an Id if none has been set ###
      @[keyFrag.idName] = keyFrag.generateId() if !@[keyFrag.idName]

      ActiveRecord.serializer.serialize(@, callback)

    ### Define getters and setters ###
    Object.defineProperties @::,
      key: 
        get: ->
          @_key = keyFrag.resolveKey(@) if @_key is null || @isChanged
          @_key
        set: (val) ->
          @_key = val

      keyValueSize: 
        get: -> 
          @_keyValueSize = @keySize + @valueSize if @_keyValueSize is null || @isChanged
          @_keyValueSize

    ### Static properties and methods ###
    @keyFrag = keyFrag
    @serializer = SerializerFactory.create(@)

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

    @index = index

    @extend = (constructor) ->
      constructor extends @