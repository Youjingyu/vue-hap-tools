const { getStatementAst } = require('../utils')

module.exports = function (vueDeclaName) {
  return getStatementAst(`
    let _qa_global_route_query_cache = {}
    ${vueDeclaName}.mixin({
      beforeCreate () {
        this.$router = {
          push (option) {
            _qa_global_route_query_cache = option.query
            _qa_router.push({
              uri: option.path,
              params: option.query
            })
          },
          replace (option) {
            _qa_global_route_query_cache = option.query
            _qa_router.replace({
              uri: option.path,
              params: option.query
            })
          },
          back () {
            _qa_router.back()
          }
        }
        this.$route = {
          query: _qa_global_route_query_cache
        }
      }
    })
  `)
}
