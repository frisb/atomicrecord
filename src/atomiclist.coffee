{EventEmitter} = require('events')	

fdb = require('fdboost')()
db = fdb.open()

save = (tr, list, callback) ->
	len = list.length
	saved = 0
	
	cb = (err) ->
		if (err)
			callback(err)
		else
			list.emit('recordsaved', record)
			saved++
			callback(null) if saved is len
	
	record.save(tr, cb) for record in list._records
	
	return

transactionalSave = fdb.transactional(save)

module.exports = class AtomicList extends EventEmitter
	constructor: (recordsOrSize) ->
		super()
		
		if (recordsOrSize instanceof Array)
			@_records = new Array(recordsOrSize.length)
			@_records[i] = record for record, i in recordsOrSize
		else if (typeof(recordsOrSize) is 'number')
			@_records = new Array(recordsOrSize)
		else 
			@_records = [] if @_records is null

	_records: null
	
	add: (record) ->
		@_records.push(record)
	
	save: (tr, callback) ->
		if (typeof(tr) is 'function')
			callback = tr
			tr = null
			
		fdb.future.create (futureCb) =>
			len = @length
			
			complete = (err) =>
				if (err)
					@emit('error', err)
					futureCb(err)
				else
					@emit('saved', len)
					futureCb(null, len)
					
			transactionalSave(tr || db, @, complete)
			return
		, callback
		
		return
		
	Object.defineProperty @::, 'length',
		get: ->
			@_records.length
		set: (val) ->
			@_records.length = val