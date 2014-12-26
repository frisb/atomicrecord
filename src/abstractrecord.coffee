Pseudonym = require('pseudonym')

###*
 * Create an AbstractRecord class 
 * @method
 * @param {string} idName First key in the query range.
 * @param {(string[]|object)} options.valueFields Last key in the query range.
 * @return {AbstractRecord} an AbstractRecord class
###    
module.exports = (idName, valueFields) ->
  if (valueFields instanceof Array)
    aliases = [idName].concat(valueFields)
  else
    aliases = Object.create(null)
    aliases[idName] = idName
    aliases[src] = dest for src, dest of valueFields
  
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