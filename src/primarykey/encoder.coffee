FDBoost = require('fdboost')()

module.exports = class Encoder
  constructor: (@primaryKey) ->

  encodeKey: (directory, obj, keySuffix) ->  
    arr = @primaryKey.resolver.resolveKey(obj)
    arr = arr.concat(keySuffix) if keySuffix
    directory.pack(arr)
    
  decodeKey: (directory, buffer, obj = {}) ->
    arr = directory.unpack(buffer)

    for i in [0...@primaryKey.keyFields.length]
      val = arr[i]
      val = FDBoost.encoding.decode(val) unless i is @primaryKey.keyFields.length - 1

      # if (i is @primaryKey.keyFields.length - 1)
      #   # id
      #   val = @primaryKey.factory.deserializeId(val)
      # else
      #   val = FDBoost.encoding.decode(val) 

      obj[@primaryKey.keyFields[i]] = val

    obj