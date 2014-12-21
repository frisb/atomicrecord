AbstractSerializer = require('./abstract')
FDBoost = require('fdboost')()
fdb = FDBoost.fdb

module.exports = class UniKeySerializer extends AbstractSerializer
  encode: (directory, record) ->
    keyArr = @ActiveRecordPrototype.keyResolver.resolve(record)
    valArr = []
    
    for i in [0...record.aliasMap.destKeys.length - 1]
      index = i + 1
      
      srcKey = record.aliasMap.srcKeys[index]
      
      if (!@ActiveRecordPrototype.fieldExclusions[srcKey])
        val = record.__d[index]
        
        if (typeof(val) isnt 'undefined')
          keyArr.push(record.aliasMap.destKeys[index])
          valArr.push(FDBoost.encoding.encode(val))
        
    encodedKey = directory.pack(keyArr)
    encodedValue = fdb.tuple.pack(valArr)
    
    record.keySize = encodedKey.length
    record.valueSize = encodedValue.length
    # partition ?= record.keySize > 100 || record.valueSize > 1024
    
    [[encodedKey, encodedValue]]
      
  decode: (foundationDBValue) ->
    record = null
    id = @key[0]
    
    record = new @ActiveRecordPrototype() 
    record.id = @key[1].toString('hex')
    record.timestamp = @key[0]
    
    map = new Array(@key.length - 1)
    values = fdb.tuple.unpack(foundationDBValue)
    
    for i in [1...@key.length]
      dest = @key[i]
      record.data(dest, values[i - 1]) 
    
    record.reset(true)
    
    console.log('decoded', record.toDocument(true))
    
    record