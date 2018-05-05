export default {
  created() {
    console.log(this.$route.query.userInfo.name)
  },
  methods: {
    gotoTodoMVC(){
      this.$router.push({
        path: '/TodoMVC',
        query: { useInfo: {name: 'John', id: 100} }
      })
    }
  }
}