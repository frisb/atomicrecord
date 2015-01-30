Pseudonym = require('pseudonym')

###*
 * Create an AbstractRecord class 
 * @method
 * @param {string} idName Record instance unique identifier name.
 * @param {string[]|object} fields AliasMap initializer.
 * @return {AbstractRecord} an AbstractRecord class
###    
module.exports = (fields) ->
  if (fields instanceof Array)
    aliases = fields
  else
    aliases = Object.create(null)
    aliases[src] = dest for src, dest of fields
  
  class AbstractRecord extends Pseudonym(aliases)
    changed: []
    isLoaded: false
    isNew: true
    
    ###*
     * Creates a new AbstractRecord instance 
     * @class
     * @return {AbstractRecord} an AbstractRecord instance
    ###
    constructor: ->
      # create pseudonym data containers
      super()
    
    ###*
     * Resets the record instance state
     * @param {Boolean} isLoaded Flag if instance has had data loaded from store.
     * @return {undefined}
    ###
    reset: (isLoaded) ->
      @isLoaded = isLoaded
      @isNew = !isLoaded
      @changed = []
      return

    ###*
     * Overrides the Pseudonym prototype setValue method
     * @virtual
     * @param {string} src Source property name.
     * @param {object} val Value to set.
     * @return {string} Property alias.
    ###
    setValue: (src, val) ->
      dest = super(src, val)
      
      return if field is src for field in @changed

      @changed.push(src)
      @isNew = false
      dest
      
    Object.defineProperty @::, 'isChanged',
      get: -> @changed.length > 0