fdb = require('fdboost')()

clear = (tr, prefix, cb) ->
  tr.clearRangeStartsWith(prefix)
  cb(null)
  return

transactionalClear = fdb.transactional(clear)

module.exports = (tr, query, callback) ->
  if (typeof(query) is 'function')
    callback = query
    query = tr
    tr = null
  else if (!query)
    query = tr
    tr = null

  fdb.future.create (futureCb) =>
    dirCallback = (err, directory) =>
      if (err)
        futureCb(err)
      else
        prefix = directory.pack(@keyFrag.resolveKey(query))
        transactionalClear(tr || db, prefix, futureCb)

      return
          
    @keyFrag.resolveDirectory(query, dirCallback)

    return
  , callback