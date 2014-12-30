AbstractSerializer = require('./abstract')
FDBoost = require('fdboost')()
fdb = FDBoost.fdb

areEqual = (recordVal, keyVal) ->
  return false if recordVal.length isnt keyVal.length

  for i in [0...recordVal.length]
    return false if recordVal[i] isnt keyVal[i]

  return true

module.exports = class MultiKeySerializer extends AbstractSerializer
  encode: (directory, record) ->
    keyValues = []
          
    for i in [0...record.aliasMap.destKeys.length]
      srcKey = record.aliasMap.srcKeys[i]
      
      if (!@primaryKey.fields[srcKey])
        val = record.__d[i]
        
        if (typeof(val) isnt 'undefined')
          destKey = record.aliasMap.destKeys[i]
          keySuffix = [destKey]

          encodedKey = @primaryKey.encoder.encodeKey(directory, record, keySuffix)
          encodedValue = FDBoost.encoding.encode(val)
          
          keyValues.push([encodedKey, encodedValue])

    keyValues
      
  decode: (directory, keyValuePair) ->
    pk = @primaryKey.encoder.decodeKey(directory, keyValuePair.key)

    dest = @key[@primaryKey.keyFields.length]

    if (@cursor isnt null)
      record = @cursor

      for field, i in @primaryKey.keyFields
        if (!areEqual(@cursor.data(field), @key[i]))
          @cursor.reset(true)
          @state.push(record)

          # create new ActiveRecord instance
          record = new @ActiveRecordPrototype(pk)
          break
    else
      # create new ActiveRecord instance
      record = new @ActiveRecordPrototype(pk)
      
    record.data(dest, keyValuePair.value)
    
    record