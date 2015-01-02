AbstractSerializer = require('./abstract')
FDBoost = require('fdboost')()
fdb = FDBoost.fdb

module.exports = class UniKeySerializer extends AbstractSerializer
  encode: (directory, record) ->
    keySuffix = []
    valArr = []

    for i in [0...record.aliasMap.destKeys.length]
      srcKey = record.aliasMap.srcKeys[i]
    
      if (!@keyFrag.fields[srcKey])
        val = record.__d[i]
        
        if (typeof(val) isnt 'undefined')
          keySuffix.push(record.aliasMap.destKeys[i])
          valArr.push(FDBoost.encoding.encode(val))

    encodedKey = @keyFrag.encodeKey(directory, record, keySuffix)
    encodedValue = fdb.tuple.pack(valArr)
    
    record.keySize = encodedKey.length
    record.valueSize = encodedValue.length
    # partition ?= record.keySize > 100 || record.valueSize > 1024
    
    [[encodedKey, encodedValue]]

  decode: (directory, keyValuePair) ->
    primaryKey = @keyFrag.decodeKey(directory, keyValuePair.key)
    record = new @ActiveRecord(primaryKey)
    
    values = fdb.tuple.unpack(keyValuePair.value)

    pkLength = @keyFrag.keyFields.length

    for i in [pkLength...@key.length]
      dest = @key[i]
      record.data(dest, values[i - pkLength]) 
    
    record.reset(true)
    
    @state.push(record)

    record