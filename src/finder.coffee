FDBoost = require('fdboost')()
fdb = FDBoost.fdb

module.exports = (query, options = {}) ->
  pkResolver = @primaryKey.resolver
  serializer = @serializer
  
  class Finder extends FDBoost.range.Reader
    finalize: (err, callback) ->
      if (serializer.state.length > 0)
        @emit('data', serializer.state)
      else if (serializer.cursor isnt null)
        serializer.cursor.reset(true)
        @emit('data', serializer.cursor)
        
      callback(err)
  
    ###*
     * Iterate over array results 
     * @override
     * @param {LazyIterator} iterator LazyIterator instance.
     * @param {iterateCallback} callback Callback.
     * @fires RangeReader#data
     * @return {undefined}
    ### 
    toArray: (iterator, callback) ->
      iterator.toArray (err, arr) =>
        cb = (records) =>
          @finalize(err, callback)

        serializer.deserialize(@directory, arr, cb)
        
        return
    
    ###*
     * Iterate over batch results 
     * @override
     * @param {LazyIterator} iterator LazyIterator instance.
     * @param {iterateCallback} callback Callback.
     * @fires RangeReader#data
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
     * @fires RangeReader#data
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
     * Execute the finder using an iterator type 
     * @override
     * @param {object} tr Optional transaction.
     * @param {string} iteratorType batch|each|array.
     * @fires RangeReader#error
     * @fires RangeReader#continue
     * @fires RangeReader#end
     * @return {undefined}
    ###        
    execute: (tr, iteratorType) ->
      callback = (@directory) =>
        @begin = @directory
        super(tr, iteratorType)
      
      pkResolver.resolveDirectory(query, callback)
      
  new Finder(options)