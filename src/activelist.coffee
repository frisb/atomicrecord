module.exports = class ActiveList extends Array
	constructor: (recordsOrSize) ->
		if (recordsOrSize instanceof Array)
			@push(record) for record of recordsOrSize
		else
			super(recordsOrSize)

	_saveRecord: (tr, index, callback) ->
		len = @length
		@[index].save tr, (err) ->
			if (err)
				callback(err)
			else if (index is len - 1)
				callback(null) 
			return
		return

	save: (tr, callback) ->
		@_saveRecord(tr, i, callback) for i in [0...@length]
		return


