AbstractSerializer = require('./abstract')
FDBoost = require('fdboost')()
fdb = FDBoost.fdb

module.exports = class UniKeySerializer extends AbstractSerializer
  encode: (directory, record) ->
    valArr = []

    for destKey, i in record.aliasMap.destKeys
      srcKey = record.aliasMap.srcKeys[i]

      if (!@primaryKey.fields[srcKey])
        val = record.__d[i]
        valArr.push(destKey, FDBoost.encoding.encode(val)) if typeof val isnt 'undefined'

    encodedKey = @primaryKey.encoder.encodeKey(directory, record)
    encodedValue = fdb.tuple.pack(valArr)
    
    record.keySize = encodedKey.length
    record.valueSize = encodedValue.length
    # partition ?= record.keySize > 100 || record.valueSize > 1024

    [[encodedKey, encodedValue]]

  decode: (directory, keyValuePair) ->
    pk = @primaryKey.encoder.decodeKey(directory, keyValuePair.key)
    record = new @ActiveRecordPrototype(pk)
    
    values = fdb.tuple.unpack(keyValuePair.value)
    record.data(field, values[i + 1])  for field, i in values
    record.reset(true)
    
    @state.push(record)

    record