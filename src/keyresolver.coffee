FDBoost = require('fdboost')()

module.exports = 
  resolve = (rec, key) ->
    resolvedKey = new Array(key.length)
    
    for subkey, i in key
      if (typeof(subkey) is 'function')
        # generate value from function
        data = subkey(rec)
      else
        # get value from record
        data = rec.data(subkey)
    
      resolvedKey[i] = FDBoost.encoding.encode(data)
      
    resolvedKey