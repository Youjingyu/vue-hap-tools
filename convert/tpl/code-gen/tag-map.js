// text 不能套text
// span 必须在text里
const map = {
  'div': 'aside,footer,header,h1,h2,h3,h4,h5,h6,nav,section,figcaption,figure,' +
    'dd,dl,dt,p,main,ul,ol,li,' +
    'table,thead,tbody,td,th,tr,' +
    'fieldset,legend,article',
  // 列表不再转为list组件
  // 'list': 'ul,ol,
  // 'list-item': 'li',
  'block': 'template',
  'progress': 'progress',
  'text': 'span,strong,i,small,sub,sup,time,u,var,b,abbr,cite,code,em,q,address,pre,del,ins,mark',
  'a': 'a,router-link',
  'label': 'label',
  'textarea': 'textarea',
  'input': 'input,button',
  'image': 'img',
  'video': 'video'
}

const newMaps = {}
Object.keys(map).forEach((key) => {
  const item = map[key]
  item.split(',').forEach((newKey) => {
    newMaps[newKey] = key
  })
})

module.exports = newMaps
