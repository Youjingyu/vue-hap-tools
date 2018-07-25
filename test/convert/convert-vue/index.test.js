/**
 * @author whale
 * @fileOverview 模板转换测试
 * @date 2018-05-05
 */

const chai = require('chai')
const expect = chai.expect
const fs = require('fs')
const path = require('path')

const convert = require('../../../convert')

const codeDir = path.resolve(__dirname, './code-tpl')
describe('vue单文件转换测试', () => {
  it('vue单文件转换测试', () => {
    const vueCode = fs.readFileSync(codeDir + '/index.vue', 'utf-8')
    const vueResCode = fs.readFileSync(codeDir + '/index.res.vue', 'utf-8')
    expect(convert(vueCode, { convertAll: true })).to.equal(vueResCode)
  })
})