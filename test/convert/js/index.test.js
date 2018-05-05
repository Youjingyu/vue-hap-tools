/**
 * @author whale
 * @fileOverview js转换测试
 * @date 2018-05-04
 */

const chai = require('hybrid-chai/chai')
const expect = chai.expect
const fs = require('fs')
const path = require('path')

const convertJs = require('../../../convert/convertJs')
function getJsString (jsString, extra = {}) {
  return convertJs(jsString, extra).jsString
}
function getTplCode(codeDir) {
  const dir = path.resolve(__dirname, './code-tpl', codeDir)
  return {
    sourceCode: fs.readFileSync(dir + '/index.js', 'utf-8'),
    resCode: fs.readFileSync(dir + '/index.res.js', 'utf-8')
  }
}
function doExpect(type, extra = {}){
  const { sourceCode, resCode } = getTplCode(type)
  const jsString = getJsString(sourceCode, extra)
  expect(jsString).to.equal(resCode)
}

describe('js转换', () => {
  it('生命周期映射', () => {
     doExpect('lifecycle')
  })
  it('组件提取', () => {
    const { sourceCode, resCode } = getTplCode('components')
    const res = convertJs(sourceCode, {})
    expect(res.jsString).to.equal(resCode)
    expect(res.components).to.deep.equal([
      { name: 'compPart1', value: '../components/compPart1' },
      { name: 'comp-part2', value: '../components/compPart2' }
    ])    
  })
  it('methods处理', () => {
    doExpect('methods')
  })
  it('computed处理', () => {
    doExpect('computed')
  })
  it('watch处理', () => {
    doExpect('watch')
  })
  it('事件回调处理', () => {
    doExpect('event-callback', {
      attrCollection: {
        changeFuncsWithVModel: {
          eventCallback: {
            isCheckbox: true,
            vModels: ['inputVal']
          }
        },
        vModels: [
          {
            changeFunc: "_kyy_v_model_change_inputVal2",
            dataName: "inputVal2",
            isCheckbox: false
          }
        ]
      }
    })
  })
  it('路由处理', () => {
    doExpect('router')
  })
})