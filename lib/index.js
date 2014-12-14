(function() {
  var AcidRecord, Star, star;

  AcidRecord = require('./acidrecord');

  Star = AcidRecord({
    fdb: fdb,
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

}).call(this);
