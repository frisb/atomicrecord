AbstractSerializer = require('./abstract')
fdb = require('fdboost')()

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
      
      if (!@keyFrag.fields[srcKey])
        val = record.__d[i]
        
        if (typeof(val) isnt 'undefined')
          destKey = record.aliasMap.destKeys[i]
          keySuffix = [destKey]

          encodedKey = @keyFrag.encodeKey(directory, record, keySuffix)
          encodedValue = fdb.encoding.encode(val)
          
          keyValues.push([encodedKey, encodedValue])

    keyValues
      
  decode: (directory, keyValuePair) ->
    primaryKey = @keyFrag.decodeKey(directory, keyValuePair.key)

    dest = @key[@keyFrag.keyFields.length]

    if (@cursor isnt null)
      record = @cursor

      for field, i in @keyFrag.keyFields
        if (!areEqual(@cursor.data(field), @key[i]))
          @cursor.reset(true)
          @state.push(record)

          # create new AtomicRecord instance
          record = new @AtomicRecord(primaryKey)
          break
    else
      # create new AtomicRecord instance
      record = new @AtomicRecord(primaryKey)
      
    record.data(dest, keyValuePair.value)
    
    record