module.exports = class AbstractSerializer
  constructor: (@ActiveRecordPrototype) ->
    @primaryKey = @ActiveRecordPrototype.primaryKey

  state: []
  cursor: null
  key: null

  serialize: (record, callback) ->
    complete = (directory) =>
      process.nextTick =>
        callback(@encode(directory, record))

        return    

    @primaryKey.resolver.resolveDirectory(record, complete)
  
  encode: (directory, record) ->
    throw new Error('not implemented')
      
  deserialize: (directory, keyValuePairs, callback) ->
    keyValuePairs = [keyValuePairs] unless keyValuePairs instanceof Array
    
    process.nextTick =>
      for kv in keyValuePairs
        @key = directory.unpack(kv.key)
        @cursor = @decode(directory, kv)
        @cursor.keySize += kv.key.length
        @cursor.valueSize += kv.value.length

      if (@state.length > 0)
        callback(@state)
        @state = [] 
  
  decode: (directory, buffer) ->
    throw new Error('not implemented')
    
  