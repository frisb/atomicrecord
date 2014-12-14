{ObjectID} = require('bson')
FDBoost = require('fdboost')()
RecordBase = require('./recordbase')

module.exports = (options) ->
  fdb = FDBoost.fdb
  db = FDBoost.db
  
  {uniqueIdName, uniqueIdFactory, fields, partition} = options
  
  uniqueIdName ?= 'id'
  uniqueIdFactory ?= -> new ObjectID().toHexString()
  
  class Record extends RecordBase(uniqueIdName, fields)
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
      @[uniqueIdName] = uniqueIdFactory() unless record || record[uniqueIdName]
    
    data: (dest, val) ->
      if (dest && typeof(val) is 'undefined')
        val = super(dest)
        
        if (val instanceof Buffer)
          val = FDBoost.encoding.decode(val)
          @data(dest, val)
          
        return val
        
      return super(dest, val)
        
    toKeyValues: (subspace) ->
      if (!@partition)
        key = [@[uniqueIdName]]
        value = []
        
        for i in [0...@schema.destKeys.length - 1]
          v = @__d[i + 1]
          if typeof v isnt 'undefined'
            key.push(@schema.destKeys[i + 1])
            value.push(FDBoost.encoding.encode(v))
            #value.push(v)
            
        encodedKey = @provider.dir.records.pack(key)
        encodedValue = fdb.tuple.pack(value)
        
        @keySize = encodedKey.length
        @valueSize = encodedValue.length
        @partition ?= @keySize > 100 || @valueSize > 1024
        
        return [[encodedKey, encodedValue]]
      else
        keyValues = []
      
        for d in @schema.destKeys
          if (d isnt uniqueIdName) 
            v = @data(d)
            keyValues.push([@provider.dir.records.pack([@[uniqueIdName], d]), FDBoost.encoding.encode(v)]) if (typeof(v) isnt 'undefined')
            
        return keyValues
      
    Object.defineProperties @::,
      keyValueSize: 
        get: -> @keySize + @valueSize