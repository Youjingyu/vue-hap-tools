<template>
  <section class="todoapp">
    <header class="header">
      <comp-part1></comp-part1>
      <h1 class="title"><span class="title-text">Todos</span></h1>
        <div class="new-todo-head">
          <input class="new-todo" placeholder="What needs to be done?" v-model="newTodo.text">
          <button @click="addTodo" class="new-todo-btn">add</button>
          <!-- quick app ignore start -->
          <span>ignore</span>
          <!-- quick app ignore end -->
        </div>
      </header>
      <section class="main" v-show="todos.length">
        <ul class="todo-list">
          <li class="todo" v-for="(todo, i) in showTodos" :key="i">
            <div class="view">
              <input type="checkbox" v-model="todo.completed" @click="toggleComplete">
              <div class="view-content" @click="focusItem(i)"><span :class="{'view-content-text': todo.completed}">{{todo.title}}</span></div>
              <div class="destroy"><span v-show="focusIndex === i" @click="removeTodo(todo)" class="destroy-icon">x</span></div>
            </div>
          </li>
        </ul>
      </section>
    </section>
</template>

<script>
import todoStorage from './js/store'
import compPart1 from '../compPart1'

var filters = {
  all: function (todos) {
    return todos
  }
}
export default {
  data () {
    const todos = todoStorage.fetch()
    return {
      todos,
      focusIndex: undefined
    }
  },
  components: {
    'comp-part1': compPart1
  },
  created () {
    console.log(this.$route.query.userInfo)
  },
  watch: {
    visibility () {
    /* quick app ignore start */   
    console.log('visibility changed')
    /* quick app ignore end */      
    }
  },
  computed: {
    showTodos () {
      return filters[this.visibility](this.todos)
    }
  },
  methods: {
    swicth: function (type) {
      this.visibility = type
    }
  }
}
</script>
<style>
@import "./css/index.css";
@import '../../css/reset.css';
/* quick app ignore start */
@import "../../css/web-reset.css";
/* quick app ignore end */
</style>
