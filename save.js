var fdb = require('fdb').apiVersion(300);
var db = fdb.open();
var async = require('async');

var data = [
	{ key: 'key0', value: 'value0' },
	{ key: 'key1', value: 'value1' },
	{ key: 'key2', value: 'value2' },
	{ key: 'key3', value: 'value3' },
	{ key: 'key4', value: 'value4' },
	{ key: 'key5', value: 'value5' },
	{ key: 'key6', value: 'value6' },
	{ key: 'key7', value: 'value7' },
	{ key: 'key8', value: 'value8' },
	{ key: 'key9', value: 'value9' }
];

function serializeKV(item, callback) {
	fdb.future.create(function (futureCb) {
    process.nextTick(function () {
			console.log(item)
			var key = new Buffer(item.key);
			var val = new Buffer(item.value);

			futureCb(key, val);
		});
  }, callback);
}

function save(tr, item, callback) {
	fdb.future.create(function (futureCb) {
		serializeKV(item, function (key, val) {
			tr.set(key, val);
			futureCb(null);
		});
	}, callback);
}

var transactionalSave = fdb.transactional(save);

function complete(err) {
	console.log('complete', err);
}

function transaction(tr, callback) {
	for (var i = 0; i < data.length; i++) {
		(function (index) {
			transactionalSave(tr, data[index], function () {
				if (index === data.length - 1) {
					callback(null);
				}
			});
		})(i);
	}
}

db.doTransaction(transaction, complete);

