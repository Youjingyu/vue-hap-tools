export default {
  computed: {
    data1() {
      return this.data.id + 1
    },
    data2() {
      return filter(this.data.list)
    }
  }
};