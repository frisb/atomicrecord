save = (tr, record, callback) ->
  cb = (arr) ->
    tr.set(kv[0], kv[1]) for kv in arr
    record.reset(true)
    
    #rec.index(tr, directory, rec)
    #rec.increment(tr, directory, rec)
    
    callback(null)
  
  record.serialize(cb)

module.exports = (tr, callback) ->
  if (typeof(tr) is 'function')
    callback = tr
    tr = null
    
  fdb.future.create (futureCb) =>
    complete = (err) =>
      futureCb(err, @)
    
    transactionalSave(tr || db, @, complete)
  , callback