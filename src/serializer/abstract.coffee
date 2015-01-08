FDBoost = require('fdboost')()
fdb = FDBoost.fdb

module.exports = class AbstractSerializer
  constructor: (@ActiveRecord) ->
    @keyFrag = @ActiveRecord.keyFrag

  state: []
  cursor: null
  key: null

  serialize: (record, callback) ->
    fdb.future.create (futureCb) =>
      complete = (err, directory) =>
        if (err)
          futureCb(err)
        else
          process.nextTick =>
            futureCb(null, @encode(directory, record))
            return 
        return   

      @keyFrag.resolveOrCreateDirectory(record, complete)
    , callback

  encode: (directory, record) ->
    throw new Error('not implemented')
      
  deserialize: (directory, keyValuePairs, callback) ->
    fdb.future.create (futureCb) =>
      keyValuePairs = [keyValuePairs] unless keyValuePairs instanceof Array
      
      process.nextTick =>
        for kv in keyValuePairs
          @key = directory.unpack(kv.key)
          @cursor = @decode(directory, kv)
          @cursor.keySize += kv.key.length
          @cursor.valueSize += kv.value.length

        if (@state.length > 0)
          futureCb(@state)
          @state = []
    , callback

  
  decode: (directory, buffer) ->
    throw new Error('not implemented')
    
  