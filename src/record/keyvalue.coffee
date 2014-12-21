{ObjectID} = require('bson')
AbstractRecord = require('./abstract')
FDBoost = require('fdboost')()

DirectoryResolver = require('../resolvers/directory')
KeyResolver = require('../resolvers/key')

module.exports = (options) ->
  fdb = FDBoost.fdb
  db = FDBoost.db
  
  {uniqueIdName, partition, keyFields, valueFields} = options
  
  uniqueIdName ?= 'id'
  
  directoryResolver = new DirectoryResolver(options)
  keyResolver = new KeyResolver(uniqueIdName, keyFields)
  
  fieldExclusions = {}
  fieldExclusions[field] = 1 for field in directoryResolver.fields
  fieldExclusions[field] = 1 for field in keyResolver.fields
  
  SerializerFactory = require('./serializer/factory')(uniqueIdName, uniqueIdFactory, keyFields, fieldExclusions)
  
  class KeyValueRecord extends AbstractRecord(uniqueIdName, valueFields)
    @directoryResolver = directoryResolver
  
    @deserialize = (ActiveRecordPrototype, directory, keyValuePairs, callback) ->
      serializer = SerializerFactory.get(partition)
      serializer.deserialize(ActiveRecordPrototype, directory, keyValuePairs, callback)
  
    keySize: 0
    valueSize: 0
    partition: partition
    
    data: (dest, val) ->
      if (dest && typeof(val) is 'undefined')
        val = super(dest)
        
        if (dest isnt uniqueIdName && val instanceof Buffer)
          val = FDBoost.encoding.decode(val)
          @data(dest, val)
          
        return val
        
      return super(dest, val)
    
    serialize: (callback) ->
      serializer = SerializerFactory.get(partition)
      serializer.serialize(@, callback)
    
    resolveDirectory: (callback) ->
      directoryResolver.resolve(@, callback)
      
    Object.defineProperties @::,
      keyValueSize: 
        get: -> @keySize + @valueSize