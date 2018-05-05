/**
 * @author whale
 * @fileOverview style转换测试
 * @date 2018-05-05
 */

const chai = require('hybrid-chai/chai')
const expect = chai.expect

const { hackSelector, convertRem } = require('../../../convert/pre-process/style-process')

describe('css处理', () => {
  it('选择器处理', () => {
    expect(hackSelector('span').selector).to.equal('text')

    const spanTestRes = hackSelector('span span')
    expect(spanTestRes.selector).to.equal('text span')
    expect(spanTestRes.log).not.to.equal('')

    expect(hackSelector('ul').log).not.to.equal('')
  })
  it('rem转换', () => {
    expect(convertRem('0.92rem')).to.equal('92px')
    expect(convertRem('1rem 0.9rem')).to.equal('100px 90px')
    expect(convertRem('1rem 0.9rem  2rem   4rem')).to.equal('100px 90px 200px 400px')
  })
})