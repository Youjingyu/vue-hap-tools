module.exports = function (vueOptionsAst) {
  return {
    'type': 'VariableDeclaration',
    'declarations': [
      {
        'type': 'VariableDeclarator',
        'id': {
          'type': 'Identifier',
          'name': '_qa_vue_options'
        },
        'init': {
          'type': 'ObjectExpression',
          'properties': vueOptionsAst
        }
      }
    ],
    'kind': 'const'
  }
}
