<import src="../compPart1" name="comp-part1"></import>
<template>
<div class="todoapp">
  <div class="header">
    <comp-part1></comp-part1>
    <div class="title"><text class="title-text">Todos</text></div>
      <div class="new-todo-head">
        <input class="new-todo" placeholder="What needs to be done?" value="{{newTodo.text}}" onchange="_kyy_v_model_change_newTodo.text">
        <input onclick="addTodo" class="new-todo-btn" type="button" value="add">
        
      </div>
    </div>
    <div class="main" show="{{todos.length}}">
      <div class="todo-list">
        <div class="todo" for="( i,todo) in showTodos">
          <div class="view">
            <input type="checkbox" checked="{{todo.completed}}" onchange="toggleComplete">
            <div class="view-content" onclick="focusItem(i)"><text class="{{todo.completed?'view-content-text':''}}">{{todo.title}}</text></div>
            <div class="destroy"><text show="{{focusIndex === i}}" onclick="removeTodo(todo)" class="destroy-icon">x</text></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import todoStorage from './js/store';
var filters = {
    all: function (todos) {
        return todos;
    }
};
export default {
    data() {
        const todos = todoStorage.fetch();
        return {
            todos,
            focusIndex: undefined,
            showTodos: ''
        };
    },
    onInit() {
        this.$route = {};
        this.$route.query = this;
        this.userInfo = new Function('return ' + this.userInfo)();
        Object.defineProperty(this, 'showTodos', {
            get: function () {
                return filters[this.visibility](this.todos);
            }
        });
        this.$watch('visibility', '_kyy_watch_visibility');
        console.log(this.$route.query.userInfo);
    },
    swicth: function (type) {
        this.visibility = type;
    },
    '_kyy_v_model_change_newTodo.text'(e) {
        e.target.value = e.value;
        this.newTodo.text = e.target.value;
    },
    _kyy_watch_visibility() {
    }
};
</script>
<style>
@import "./css/index.css";
@import '../../css/reset.css';

</style>