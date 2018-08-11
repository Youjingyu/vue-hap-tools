const { getImportAst } = require('../utils')

module.exports = function (importDecla, useRouter) {
  let vueDeclaName
  for (let i = 0; i < importDecla.length; i++) {
    if (importDecla[i].source.value === 'vue') {
      vueDeclaName = importDecla[i].specifiers[0].local.name
      break
    }
  }
  if (!vueDeclaName) {
    vueDeclaName = '_qa_Vue'
    importDecla = importDecla.concat(getImportAst(`import ${vueDeclaName} from 'vue'`))
  }
  if (useRouter) {
    importDecla = importDecla.concat(getImportAst(`import _qa_router from '@system.router'`))
  }
  return {
    ast: importDecla,
    vueDeclaName
  }
}
