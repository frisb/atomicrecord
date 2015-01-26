AbstractSerializer = require('./abstract')
FDBoost = require('fdboost')()
fdb = FDBoost.fdb

module.exports = class UniKeySerializer extends AbstractSerializer
  encode: (directory, record) ->
    valArr = []

    for destKey, i in record.aliasMap.destKeys
      srcKey = record.aliasMap.srcKeys[i]

      if (!@keyFrag.fields[srcKey])
        val = record.__d[i]

        valArr.push(destKey, FDBoost.encoding.encode(val)) if typeof val isnt 'undefined'

    encodedKey = @keyFrag.encodeKey(directory, record)
    encodedValue = fdb.tuple.pack(valArr)
    
    record.key = encodedKey
    record.keySize = encodedKey.length
    record.valueSize = encodedValue.length
    # partition ?= record.keySize > 100 || record.valueSize > 1024

    [[encodedKey, encodedValue]]

  decode: (directory, keyValuePair) ->
    record = new @AtomicRecord()
    record.key = keyValuePair.key
    record.keySize = keyValuePair.key.length
    record.valueSize = keyValuePair.value.length

    @keyFrag.decodeDirectory(directory, record)
    @keyFrag.decodeKey(directory, keyValuePair.key, record)

    valueItems = fdb.tuple.unpack(keyValuePair.value)

    record.data(field, valueItems[i + 1]) for field, i in valueItems
    record.reset(true)

    @state.push(record)

    record