ActiveList = require('./activelist')
FDBoost = require('fdboost')()
db = FDBoost.db

module.exports = class ActiveQueue extends ActiveList
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