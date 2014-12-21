module.exports = class PrimaryKey
  @extend = (superConstructor) ->
    superConstructor extends @
    
  getIdName: ->
    'id'
    
  toKey: (arr?) ->
    
  toParam: (Buffer?) ->