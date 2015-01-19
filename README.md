# AtomicRecord 

AtomicRecord is a super lightweight node.js ActiveRecord ORM layer for FoundationDB.

This module is still early alpha and work is in progress. All contributions are welcome.

## Example Usage

#### Create AtomicRecord Class
``` js
var AtomicRecord = require('atomicrecord');

var Person = AtomicRecord({
  database: 'myDatabaseName',
  dataset: 'people',
  partition: false,

  primaryKey: {
    getKeyFields: function () {
      return ['timestamp', 'id'];
    },
      
    getDirectoryFields: function () {
      return ['region'];
    }
  },
    
  fields: {
    firstName: 'f',
    lastName: 'l',
    gender: 'g',
    age: 'a',
    region: 'r',
    contacts: 'c',
    enabled: 'e',
    timestamp: 't'
  }
});
```

#### Transactional Save
``` js
function complete(err, person) {
	if (err) {
		console.error(err);
	}
	else {
		console.log('transaction complete: person saved', person);
	}
}

function transaction(tr, callback) {
	// create person instance
	var person = new Person();

	person.firstName = 'John';
	person.lastName = 'Smith';
	person.gender = 'M'
	person.age = 30
	person.region = 'USA';
	person.contacts = ['+1-212-555-1234', '+1-917-555-6789'];
	person.timestamp = new Date();

	person.save(tr, callback);
}

Person.doTransaction(transaction, complete);
```

#### Non-Transactional Save
``` js
// create person instance
var person = new Person();

person.firstName = 'John';
person.lastName = 'Smith';
person.gender = 'M'
person.age = 30
person.region = 'USA';
person.contacts = ['+1-212-555-1234', '+1-917-555-6789'];
person.timestamp = new Date();

person.save(function (err, p) {
  if (err) {
    console.error(err);
  }
  else {
    console.log('person saved', p);
  }
});
```

#### Transactional AtomicQueue Batch Save
``` js
function complete(err) {
  if (err) {
    console.error(err);
  }
  else {
    console.log('transaction complete');
  }
}

function transaction(tr, callback) {
	// create person instances with initializers

	var john = new Person({
		firstName: 'John',
		lastName: 'Smith',
		gender: 'M',
		age: 30,
		region: 'USA',
		contacts: ['+1-212-555-1234', '+1-917-555-6789'],
		timestamp: new Date()
	});

	var sarah = new Person({
		firstName: 'Sarah',
		lastName: 'Jones',
		gender: 'F',
		age: 25,
		region: 'Europe',
		contacts: '+44-207-1234-5678',
		timestamp: new Date()
	});

	var people = [john, sarah];

	// batch save every 1sec
	var queue = new AtomicRecord.Queue(people);

	queue.on('saved', function (count) {
	  console.log('saved', count);
	});

	queue.on('error', function (err) {
	  console.error(err);
	});

	queue.on('recordsaved', function (record) {
		console.log('record saved');
	  console.log('unaliased document', record.toDocument());
	  console.log();
	  console.log('aliased document', record.toDocument(true));
	  console.log();
	});

	queue.save(tr, callback);
}

Person.doTransaction(transaction, complete);
```

#### Non-Transactional AtomicQueue Batch Save
``` js
// batch save every 1sec
var queue = new AtomicRecord.Queue(people, { batchSaveDelay: 1000 });

queue.on('saved', function (count) {
  console.log('saved', count);
});

queue.on('error', function (err) {
  console.error(err);
});

queue.on('recordsaved', function (record) {
	console.log('record', record);
});

// continuously push records into the queue for processing
for (var i = 0; i < 10000; i++) {
	queue.add(people[i]); // people is a pseudo-array
}
```

#### Transactional Find
``` js
function complete(err) {
	if (err) {
		console.error(err);
	}
	else {
		console.log('transaction complete')
	}
}

function transaction(tr, callback) {
  var finder = Person.find({ region: 'USA' });
  
  finder.on('data', function (data) {
    for (var i = 0; i < data.length; i++) {
      var record = data[i];
      console.log('keySize', record.keySize);
      console.log('valueSize', record.valueSize);
      console.log('record', record);
      console.log()
    }
  });
    
  finder.on('error', function (err) {
    console.error('err', err);
  });
    
  finder.on('continue', function () {
    tr.options.setReadYourWritesDisable();
  });
    
  finder.on('end', function () {
    console.log('end');
    callback(null);
  });
  
  finder.execute(tr, 'array');
}

Person.doTransaction(transaction, complete);
```

#### Non-Transactional Find
``` js
var finder = Person.find({ region: 'USA' });

finder.on('data', function (data) {
  for (var i = 0; i < data.length; i++) {
      var record = data[i];
      console.log('keySize', record.keySize);
      console.log('valueSize', record.valueSize);
      console.log('record', record);
      console.log()
    }
});
  
finder.on('error', function (err) {
  console.error('err', err);
});
  
finder.on('end', function () {
  console.log('end');
  callback(null);
});

finder.execute('array');
```

## Roadmap
More comments and elaborate on README
Finalize Indexing
Polish the Finder class and iteratorTypes
Relational data


## Installation
```
cd node_modules
git clone git@github.com:frisb/atomicrecord.git
cd atomicrecord
npm install
```

## License

(The MIT License)

Copyright (c) frisB.com &lt;play@frisb.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[![Analytics](https://ga-beacon.appspot.com/UA-40562957-12/atomicrecord/readme)](https://github.com/igrigorik/ga-beacon)
