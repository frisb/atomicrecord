Pseudonym = require('pseudonym')

module.exports = (uniqueIdName, fields) ->
  if (fields instanceof Array)
    aliases = [uniqueIdName].concat(fields)
  else
    aliases = Object.create(null)
    aliases[uniqueIdName] = uniqueIdName
    aliases[src] = dest for src, dest of fields
  
  class AbstractRecord extends Pseudonym(aliases)
    changed: []
    isLoaded: false
    isNew: true
    
    constructor: ->
      # create pseudonym data containers
      super()
      
    reset: (isLoaded) ->
      @isLoaded = isLoaded
      @isNew = !isLoaded
      @changed = []
      return

    setValue: (key, val) ->
      dest = super(key, val)
      
      for field in @changed 
        return if field is key
        
      @changed.push(key)
      @isNew = false
      return
      
    Object.defineProperty @::, 'isChanged',
      get: -> @changed.length > 0