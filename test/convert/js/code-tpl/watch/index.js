export default {
  data(){
    return {
      data1: ''
    }
  },
  watch: {
    data1(){
      console.log('data1 changed')
    }
  }
}