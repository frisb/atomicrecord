module.exports = class ID extends Buffer
  constructor: (hexStr) ->
    super(hexStr, 'hex')
    
  toString: ->
    super('hex')
    
  toJSON: ->
    @toString()