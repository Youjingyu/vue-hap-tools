const { getStatementAst } = require('../utils')

module.exports = function (vueDeclaName) {
  return getStatementAst(`
    let _qa_global_route_query_cache = {}
    const _qa_old_router_push = _qa_router.push
    const _qa_router_push = function (option) {
      _qa_global_route_query_cache = option.query
      _qa_old_router_push({
        uri: option.path,
        params: option.query
      })
    }
    const _qa_old_router_replace = _qa_router.replace
    const _qa_router_replace = function (option) {
      _qa_global_route_query_cache = option.query
      _qa_old_router_replace({
        uri: option.path,
        params: option.query
      })
    }
    ${vueDeclaName}.mixin({
      beforeCreate () {
        this.$router = _qa_router

        this.$router.push = _qa_router_push
        this.$router.replace = _qa_router_replace

        this.$route = {
          query: _qa_global_route_query_cache
        }
      }
    })
  `)
}
