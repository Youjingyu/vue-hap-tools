const Serializer = require('../../node_modules/parse5/lib/serializer/index')

const selfCloseTags = [
  'area',
  'base',
  'basefont',
  'bgsound',
  'br',
  'col',
  'embed',
  'frame',
  'hr',
  'img',
  'input',
  'keygen',
  'link',
  'menuitem',
  'meta',
  'param',
  'source',
  'track',
  'wbr'
]

const _serializeElement = Serializer.prototype._serializeElement
Serializer.prototype._serializeElement = function (node) {
  _serializeElement.call(this, node)
  const tagname = this.treeAdapter.getTagName(node)
  if (selfCloseTags.includes(tagname)) {
    this.html = this.html.replace(/>$/, '/>')
  }
}
