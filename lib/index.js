(function() {
  var AcidRecord, Star, finder, options, star;

  AcidRecord = require('./acidrecord');

  Star = AcidRecord({
    apiVersion: 300,
    database: 'star',
    dataset: 'cdrs',
    partition: false,
    fields: {
      A: 'a',
      B: 'b',
      BZero: 'b0',
      carrier: 'c',
      error: 'e',
      sequence: 's',
      timestamp: 't',
      unknown: 'u'
    },
    rootPath: '/acidrecord/star',
    datasetPath: function(star) {
      return "datasets/cdrs/" + star.carrier;
    }
  });

  star = new Star({
    A: '27824455566',
    B: '14154125111',
    carrier: 64502,
    error: 480,
    sequence: 4
  });

  star.save();

  options = {
    datasetPath: "datasets/cdrs/64502"
  };

  finder = Star.findAll(options);

  finder.on('data', function(data) {
    return console.log('data', data);
  });

  finder.on('error', function(err) {
    return console.error('err', err);
  });

  finder.on('end', function() {
    return console.log('end', null);
  });

  finder.execute('array');

}).call(this);
