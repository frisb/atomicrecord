module.exports = class AbstractSerializer
  assembled: []
  currentRecord: null
  key: null

  constructor: (@ActiveRecordPrototype) ->

  serialize: (record, callback) ->
    complete = (directory) =>
      process.nextTick =>
        callback(@encode(directory, record))
          
      return
          
    record.resolveDirectory(complete)
  
  encode: (directory, record) ->
    throw new Error('not implemented')
      
  deserialize: (directory, keyValuePairs, callback) ->
    keyValuePairs = [keyValuePairs] unless keyValuePairs instanceof Array
    
    process.nextTick =>
      for kv in keyValuePairs
        @key = directory.unpack(kv.key)
        @currentRecord = @decode(kv.value)
        @currentRecord.keySize += kv.key.length
        @currentRecord.valueSize += kv.value.length
        
      if (@assembled.length > 0)
        callback(@assembled)
        @assembled = [] 
  
  decode: (foundationDBValue) ->
    throw new Error('not implemented')
    
  