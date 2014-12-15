FDBoost = require('fdboost')()
fdb = FDBoost.fdb

module.exports = class RecordQuery extends FDBoost.range.Query
  assembled: []
  currentRecord: null
  key: null

  constructor: (options) ->
    {@ActiveRecord} = options
    super(options)

  parse: (arr) ->
    arr = [arr] unless arr instanceof Array
    
    process.nextTick =>
      for kv in arr
        @assembled.push('testKey', fdb.tuple.unpack(kv.key))
        
        #@key = @subspace.unpack(kv.key)
        #@currentRecord = @buildRecord(kv.value)
        #@currentRecord.keySize += kv.key.length
        #@currentRecord.valueSize += kv.value.length
        
      if (@assembled.length > 0)
        @emit('data', @assembled)
        @assembled = [] 
        
  buildRecord: (value) ->
    obj = null
    id = @key[0]
    partitioned = @key.length <= 2
    
    if (!partitioned)
      obj = new @ActiveRecord(id) 
      map = new Array(@key.length - 1)
      values = fdb.tuple.unpack(value)
      
      for i in [1...@key.length]
        dest = @key[i]
        obj.data(dest, values[i - 1]) 
      
      obj.reset(true)
      @assembled.push(obj)
    else
      dest = @key[1]
      
      if (@currentRecord isnt null)
        obj = @currentRecord
  
        if (@currentRecord.id isnt id)
          @currentRecord.reset(true)
          @assembled.push(obj)
  
          # create new ActiveRecord instance
          obj = new @ActiveRecord(id)
      else
        # create new ActiveRecord instance
        obj = new @ActiveRecord(id)
        
      obj.data(dest, value) if (dest)
      
    obj
    
  finalize: (err, callback) ->
    if (@assembled.length > 0)
      @emit('data', @assembled)
    else if (@currentRecord isnt null)
      @currentRecord.reset(true)
      @emit('data', @currentRecord)
      
    callback(err)

  ###*
   * Iterate over array results 
   * @override
   * @param {LazyIterator} iterator LazyIterator instance.
   * @param {iterateCallback} callback Callback.
   * @fires RangeQuery#data
   * @return {undefined}
  ###     
  toArray: (iterator, callback) ->
    iterator.toArray (err, arr) =>
      @parse(arr)
      @finalize(err, callback)
      return
  
  ###*
   * Iterate over batch results 
   * @override
   * @param {LazyIterator} iterator LazyIterator instance.
   * @param {iterateCallback} callback Callback.
   * @fires RangeQuery#data
   * @return {undefined}
  ###         
  forEachBatch: (iterator, callback) ->
    complete = (err) =>
      @finalize(err, callback)
    
    func = (arr, next) =>
      @parse(arr)
      next()
      return
     
    iterator.forEachBatch(func, complete)
  
  ###*
   * Iterate over key-value pair results 
   * @override
   * @param {LazyIterator} iterator LazyIterator instance.
   * @param {iterateCallback} callback Callback.
   * @fires RangeQuery#data
   * @return {undefined}
  ###     
  forEach: (iterator, callback) ->
    complete = (err) =>
      @finalize(err, callback)
      
    func = (kv, next) =>
      @parse(kv)
      next()
      return
     
    iterator.forEach(func, complete)
  
  ###*
   * Execute the query using an iterator type 
   * @override
   * @param {object} tr Optional transaction.
   * @param {string} iteratorType batch|each|array.
   * @fires RangeQuery#error
   * @fires RangeQuery#continue
   * @fires RangeQuery#end
   * @return {undefined}
  ###        
  execute: (tr, iteratorType) ->
    @ActiveRecord.getDirectory { carrier: 64502 }, (directory) => 
      @begin = directory
      
      super(tr, iteratorType)