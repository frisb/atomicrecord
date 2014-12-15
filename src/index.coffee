AcidRecord = require('./acidrecord')

Star = AcidRecord
  apiVersion: 300
  database: 'star'
  dataset: 'cdrs'
  partition: false
  
  
  
  fields: 
    A: 'a'
    B: 'b'
    BZero: 'b0'
    carrier: 'c'
    error: 'e'
    sequence: 's'
    timestamp: 't'
    unknown: 'u'
  rootPath: '/acidrecord/star'
  datasetPath: (star) ->
    "datasets/cdrs/#{star.carrier}"
    
star = new Star({ A: '27824455566', B: '14154125111', carrier: 64502, error: 480, sequence: 4 })
star.save()

options = 
  datasetPath: "datasets/cdrs/64502"

finder = Star.findAll(options)

finder.on 'data', (data) ->
  console.log('data', data)
  
finder.on 'error', (err) ->
  console.error('err', err)
  
#query.on 'continue', ->
  #tr.options.setReadYourWritesDisable()
  #
finder.on 'end', ->
  console.log('end', null)

finder.execute('array')
