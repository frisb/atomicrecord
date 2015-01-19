module.exports = (indexName, index) ->
	class AtomicIndex
		name: indexName
		tests: []
		execute: (tr, directory, record) ->
			if (@test(record))
				console.log('directory', directory)
				console.log('index', @name)

		test: (record) ->
			for testName in @tests
				valid = @[testName](record)
				continue if valid
				return false
			return true

		createTest = (testName, field, value) =>
			@::[testName] = (record) ->
				return true if record[field] is value
				return false

			@::tests.push(testName)

		if (index.condition)
			if (typeof(index.condition) is 'function')
				@::test = index.condition
			else
				createTest("test#{field}", field, value) for field, value of index.condition