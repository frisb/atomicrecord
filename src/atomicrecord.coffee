AbstractRecord = require('./abstractrecord')

#_INCREMENTAL = new Buffer(4)
#_INCREMENTAL.writeUInt32LE(1, 0)

###*
 * Create an AtomicRecord class 
 * @method
 * @param {object} options AtomicRecord type specific options.
 * @param {object} [options.fdb=undefined] fdb API instance.
 * @param {string} options.database Database name.
 * @param {string} options.dataset Data collection name.
 * @param {Boolean} options.partition Flag if AtomicRecord type instance storage is partitioned.
 * @param {string[]|object} options.fields AliasMap initializer.
 * @param {object} [options.primaryKey] Override methods for keyfrag Primary Key generator.
 * @return {AtomicRecord} an AtomicRecord class
###    
module.exports = (options) ->
  throw new Error('No AtomicRecord options specified.') unless options
  
  {fdb, database, dataset, partition, fields, primaryKey, indexes} = options

  throw new Error('Database name not specified.') unless database
  throw new Error('Dataset name not specified.') unless dataset
  
  fdb = require('fdboost')(fdb)
  db = fdb.open()

  AtomicIndex = require('./atomicindex')
  SerializerFactory = require('./serializer/factory')

  keyFrag = require('./keyfrag')(database, dataset, primaryKey)

  activeIndexes = 
    names: []

  for indexName, index of indexes
    Index = AtomicIndex(indexName, index)
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
        
        callback(null, record)
    
    record.serialize(cb)

  remove = (tr, record, callback) ->
    tr.clear(record.key)

    ### todo: delete indexes keys ###

    ### callback since if db.clear returns future ###
    callback(null)
  
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
  transactionalRemove = fdb.transactional(remove)
  transactionalIndex = fdb.transactional(index)

  class AtomicRecord extends AbstractRecord(fields)
    ###*
     * Creates a new typed AtomicRecord instance
     * @class
     * @param {object} [record] Record object initializer.
     * @return {Record} a typed AtomicRecord instance.
    ###
    constructor: (initializer) ->
      super()
      
      if (initializer)
        switch typeof initializer
          when 'string', 'number' then @[keyFrag.idName] = keyFrag.serializeId(initializer)
          when 'object'
            for src, val of initializer
              if (src is keyFrag.idName)
                @[src] = keyFrag.serializeId(val)
              else
                @[src] = val
          else
            throw new Error('Initializer must be a record, string or number')

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
          val = fdb.encoding.decode(val)
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
     * @param {AtomicRecord} record The current AtomicRecord instance if the save method was successful.
    ###

    ###*
     * Persists record to the database
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

    ###*
     * Deletes record from the database
     * @method
     * @param {object} [tr=null] Transaction.
     * @param {saveCallback} callback Calback.
     * @return {Future}
    ###
    remove: (tr, callback) ->
      if (typeof(tr) is 'function')
        callback = tr
        tr = null
        
      fdb.future.create (futureCb) =>
        transactionalRemove(tr || db, @, futureCb)
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
      recordHasId = typeof @[keyFrag.idName] isnt 'undefined'
      aliasMapHasId = typeof @aliasMap.srcIndex[keyFrag.idName] isnt 'undefined'

      @[keyFrag.idName] = keyFrag.generateId() if !recordHasId && aliasMapHasId

      AtomicRecord.serializer.serialize(@, callback)

    ### Define getters and setters ###
    Object.defineProperties @::,
      key: 
        get: ->
          # @_key = keyFrag.resolveKey(@) if @_key is null || @isChanged
          # @_key

          throw new Error('Record must be loaded or saved to generate key') if @_key is null
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

    @fdb = fdb
    @db = db

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

    @findOne = (tr, query, callback) ->
      if (typeof(query) is 'function')
        callback = query
        query = tr
        tr = null
      else if (!query)
        query = tr
        tr = null

      fdb.future.create (futureCb) =>
        record = null
        finder = @find(query, { limit: 1 })

        finder.on 'data', (data) ->
          record = data[0]
          return

        finder.on 'error', (err) ->
          futureCb(err)
          return

        finder.on 'end', ->
          futureCb(null, record)
          return

        finder.execute(tr, 'array')
      , callback

    @index = index

    @extend = (constructor) ->
      ctorProto = constructor::
      constructor extends @
      constructor::[k] = v for k, v of ctorProto
      AtomicRecord.serializer.AtomicRecord = constructor
      constructor