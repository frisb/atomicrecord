AbstractSerializer = require('./abstract')
FDBoost = require('fdboost')()
fdb = FDBoost.fdb

module.exports = class MultiKeySerializer extends AbstractSerializer
  encode: (directory, record) ->
    keyValues = []
          
    for i in [0...@aliasMap.destKeys.length - 1]
      index = i + 1
      
      srcKey = @aliasMap.srcKeys[index]
      
      if (!fieldExclusions[srcKey])
        val = @__d[index]
        
        if (typeof(val) isnt 'undefined')
          destKey = @aliasMap.destKeys[index]
          
          keyArr = @ActiveRecordPrototype.keyResolver.resolve(@, [destKey])
          
          encodedKey = directory.pack(keyArr)
          encodedValue = FDBoost.encoding.encode(val)
          
          keyValues.push([encodedKey, encodedValue])
        
    keyValues
      
  decode: (foundationDBValue) ->
    record = null
    id = @key[0]
    dest = @key[1]
    
    if (@currentRecord isnt null)
      record = @currentRecord

      if (@currentRecord.id isnt id)
        @currentRecord.reset(true)
        @assembled.push(record)

        # create new ActiveRecord instance
        record = new @ActiveRecordPrototype(id)
    else
      # create new ActiveRecord instance
      record = new @ActiveRecordPrototype(id)
      
    record.data(dest, value) if (dest)
    
    record