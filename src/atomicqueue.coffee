AtomicList = require('./atomiclist')
fdb = require('fdboost')()
db = fdb.open()

module.exports = class AtomicQueue extends AtomicList
	constructor: (recordsOrSize, options) ->
		super(recordsOrSize)
		
		if (!options)
			if (typeof(recordsOrSize) is 'object' && !(recordsOrSize instanceof Array))
				options = recordsOrSize
			else 
				options = {}
		
		if (options.batchSaveDelay)
			transaction = (tr, callback) =>
				@save(tr, callback)
			
			complete = (err) ->
				
			setInterval =>
				db.doTransaction(transaction, complete) if @length > 0
			, options.batchSaveDelay

	save: (tr, callback) ->
		cb = (err) =>
			@length = 0 if !err
			callback(err)
			
		super(tr, cb)
		return