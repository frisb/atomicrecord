FDBoost = require('fdboost')()

module.exports = class KeyResolver
  constructor: (@idField, @fields = []) ->

  resolve: (record, keySuffix) ->
    fieldsLen = @fields.length
    size = fieldsLen + 1
    size += keySuffix.length if keySuffix
    
    arr = new Array(size)
    arr[i] = FDBoost.encoding.encode(record[field]) for field, i in @fields
    
    arr[fieldsLen] = record[@idField]
    
    if (keySuffix)
      arr[fieldsLen + i] = field for field, i in keySuffix
    
    arr