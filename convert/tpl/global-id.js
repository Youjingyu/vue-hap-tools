let id = 0

module.exports = {
  get () {
    return id++
  },
  reset () {
    id = 0
  }
}
