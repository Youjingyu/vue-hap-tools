/**
 * @author whale
 * @fileOverview 模板转换测试
 * @date 2018-05-04
 */

const chai = require('chai')
const expect = chai.expect

const convertTpl = require('../../../convert/tpl')

function getTpl(tpl){
  return convertTpl(tpl).tpl
}

describe('标签转换', () => {
  it('tag name', () => {
    const tagConvertMap = convertTpl.tagConvertMap
    Object.keys(tagConvertMap).forEach(tagName => {
      expect(getTpl(`<${tagName}></${tagName}>`))
        .to.include(tagConvertMap[tagName])
    });
  })
  it('button转换', () => {
    expect(getTpl('<button>text</button>'))
        .to.equal('<input type="button" value="text">')
  })
})
describe('指令转换', () => {
  it('v-for', () => {
    expect(getTpl('<div v-for="(item,key) in items"></div>'))
      .to.equal('<div for="(key,item) in items"></div>')
  })
  it('v-if', () => {
    expect(getTpl('<div v-if="ifShow"></div>'))
      .to.equal('<div if="{{ifShow}}"></div>')
  })
  it('v-else-if', () => {
    expect(getTpl('<div v-else-if="ifShow"></div>'))
      .to.equal('<div elif="{{ifShow}}"></div>')
  })
  it('v-else', () => {
    expect(getTpl('<div v-else></div>'))
      .to.equal('<div else=""></div>')
  })
  it('v-show', () => {
    expect(getTpl('<div v-show="show"></div>'))
      .to.equal('<div show="{{show}}"></div>')
  })
  it('v-bind', () => {
    expect(getTpl('<div v-bind:class="class1"></div>'))
      .to.equal('<div class="{{class1}}"></div>')
    expect(getTpl('<div :class="class1"></div>'))
      .to.equal('<div class="{{class1}}"></div>')
  })
  it('v-on', () => {
    expect(getTpl('<div v-on:click="clickFunc"></div>'))
      .to.equal('<div onclick="clickFunc"></div>')
    expect(getTpl('<div @click="clickFunc"></div>'))
      .to.equal('<div onclick="clickFunc"></div>')
  })
  it('v-model', () => {
    const res = convertTpl(`
      <input v-model="inputVal">
      <input v-model="inputVal2" @input="inputFunc">
      <input type="checkbox" v-model="inputVal3">
    `)
    expect(res.tpl).to.equal(`
      <input value="{{inputVal}}" onchange="_kyy_v_model_change_inputVal">
      <input value="{{inputVal2}}" onchange="inputFunc">
      <input type="checkbox" checked="{{inputVal3}}" onchange="_kyy_v_model_change_inputVal3">
    `)
    expect(res.attrCollection).to.deep.equal({
      changeFuncsWithVModel: {
        inputFunc: {
          isCheckbox: false,
          vModels: ['inputVal2']
        }
      },
      vModels: [
        {
          changeFunc: "_kyy_v_model_change_inputVal",
          dataName: "inputVal",
          isCheckbox: false
        },
        {
          changeFunc: "_kyy_v_model_change_inputVal3",
          dataName: "inputVal3",
          isCheckbox: true
        }
      ]
    })
  })
})
describe('特异性转换', () => {
  it('对象形式的class绑定', () => {
    expect(getTpl('<div :class="{class1: useClass1 === true, class2: useClass2 === true }"></div>'))
        .to.equal(`<div class="{{useClass1===true?'class1':''}} {{useClass2===true?'class2':''}}"></div>`)
  })
  it('动态属性与静态属性合并', () => {
    expect(getTpl('<div class="class1" :class="{class2: useClass2 === true}"></div>'))
        .to.equal(`<div class="{{useClass2===true?'class2':''}} {{'class1'}}"></div>`)
  })
  it('删除key属性', () => {
    expect(getTpl('<li key="1"></li>'))
        .to.equal(`<div></div>`)
  })
  it('label的for属性修改为target', () => {
    expect(getTpl('<label for="id"></label>'))
        .to.equal(`<label target="id"></label>`)
  })
  it('a的to属性修改为href', () => {
    expect(getTpl('<a to="./path"></a>'))
        .to.equal(`<a href="./path"></a>`)
  })
  it('text嵌套text，子节点修改为span', () => {
    expect(getTpl('<span><span></span></span>'))
        .to.equal(`<text><span></span></text>`)
  })
})
