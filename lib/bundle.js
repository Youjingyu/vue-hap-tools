"use strict";

function _interopRequireDefault(e) {
  return e && e.__esModule ? e : {
    default: e
  }
}

function signZip(e, t, n, r) {
  var i = Buffer.from(_signature2.default.Base64.unarmor(n)),
    a = new _jsrsasign2.default.X509;
  a.readCertPEM(n.toString());
  var s = _jsrsasign2.default.KEYUTIL.getPEM(a.subjectPublicKeyRSA),
    l = _fs2.default.readFileSync(e.zip);
  if (!l || l.length <= 4) return _util.colorconsole.log("### App Loader ### Zip文件打开失败:", e.zip), !1;
  if ("4034b50" !== l.readInt32LE(0).toString(16).toLowerCase()) return _util.colorconsole.log("### App Loader ### Zip文件格式错误:", e.zip), !1;
  var u = parserZip(l);
  return u.options = e, u.tag && (Object.keys(u.sections).forEach(function(e) {
    var n = u.sections[e];
    processChunk(l, n, t)
  }), signChunk(u, t, s, i), r || (r = makeSignFile(e.zip)), saveChunk(l, u, r)), !0
}

function parserZip(e) {
  var t = {
    tag: !1,
    length: e.length,
    sections: {
      header: null,
      central: null,
      footer: null
    }
  };
  return t.sections.footer = readEOCD(e), t.sections.footer.tag && (t.sections.central = readCD(e, t.sections.footer.previous, t.sections.footer.startIndex - t.sections.footer.previous), t.sections.central.tag && (t.sections.header = readFH(e, t.sections.central.previous, t.sections.central.startIndex - t.sections.central.previous), t.sections.header.tag && (t.tag = !0))), t
}

function readEOCD(e) {
  var t = {
    tag: !1
  };
  if (e && e.length >= 22)
    for (var n = e.length - 22, r = void 0; n >= 0;) {
      if (r = e.readInt32LE(n), "6054b50" === r.toString(16).toLowerCase()) {
        t.tag = !0, t.startIndex = n, t.len = e.length - n, t.previous = e.readInt32LE(n + 16);
        break
      }
      n -= 1
    }
  return t
}

function readCD(e, t, n) {
  var r = {
    tag: !1
  };
  if (e && e.length >= t) {
    "2014b50" === e.readInt32LE(t).toString(16).toLowerCase() && (r.tag = !0, r.startIndex = t, r.len = n, r.previous = e.readInt32LE(t + 42))
  }
  return r
}

function readFH(e, t, n) {
  var r = {
    tag: !1
  };
  if (e && e.length >= t) {
    "4034b50" === e.readInt32LE(t).toString(16).toLowerCase() && (r.tag = !0, r.startIndex = t, r.len = n, r.previous = -1)
  }
  return r
}

function processChunk(e, t, n) {
  var r = t.startIndex,
    i = t.startIndex + t.len,
    a = e.slice(r, i),
    s = Buffer.alloc(5 + t.len);
  s[0] = 165, s.writeInt32LE(a.length, 1), a.copy(s, 5);
  var l = _crypto2.default.createHash("SHA256");
  l.update(s), t.sign = l.digest()
}

function hashFile(e, t) {
  var n = t.readFileSync(e),
    r = _crypto2.default.createHash("SHA256");
  return r.update(n), r.digest()
}

function signChunk(e, t, n, r) {
  function i(e) {
    e.copy(l, u), u += e.length
  }
  var a = e.sections,
    s = a.header.sign.length + a.central.sign.length + a.footer.sign.length + 5,
    l = Buffer.alloc(s),
    u = 0;
  l.writeInt8(90, 0), l.writeInt32LE(3, 1), u += 5, i(a.header.sign), i(a.central.sign), i(a.footer.sign);
  var o = _crypto2.default.createHash("SHA256");
  o.update(l);
  var g = o.digest(),
    f = makeSignChunk(e.options, g, t, n, r);
  e.signchunk = saveSignChunk(f)
}

function makeSignChunk(e, t, n, r, i) {
  var a = Buffer.alloc(t.length + 12);
  a.writeInt32LE(t.length + 8, 0), a.writeInt32LE(259, 4), a.writeInt32LE(t.length, 8), t.copy(a, 12);
  var s = {
      len: a.length,
      buffer: a
    },
    l = Buffer.alloc(i.length + 4);
  l.writeInt32LE(i.length, 0), i.copy(l, 4);
  var u = {
      len: l.length,
      buffer: l
    },
    o = {
      len: 12,
      digests: {
        size: 0,
        data: []
      },
      certs: {
        size: 0,
        data: []
      },
      additional: 0
    };
  o.digests.data.push(s), o.digests.size += s.len, o.len += s.len, o.certs.data.push(u), o.certs.size += u.len, o.len += u.len;
  var g = Buffer.from(_signature2.default.Base64.unarmor(r)),
    f = {
      len: 16 + g.length,
      size: 12 + g.length,
      signdata: {
        size: 0,
        buffer: null
      },
      signatures: {
        size: 0,
        data: []
      },
      pubkey: {
        size: g.length,
        buffer: g
      }
    };
  f.signdata.buffer = makeSignDataBuffer(o), f.signdata.size = o.len, f.size += o.len, f.len += o.len;
  var c = _crypto2.default.createSign("RSA-SHA256");
  c.update(f.signdata.buffer);
  var d = c.sign(n),
    h = {
      len: d.length + 12,
      size: d.length + 8,
      id: 259,
      buffer: d
    };
  f.signatures.data.push(h), f.signatures.size += h.len, f.size += h.len, f.len += h.len;
  var p = {
    len: 4,
    size: 0,
    data: []
  };
  p.data.push(f), p.size += f.len, p.len += f.len;
  var v = {
      len: p.len + 12,
      size: p.len + 4,
      id: 16777473,
      value: p
    },
    I = {
      len: 32,
      size: 24,
      data: []
    };
  if (I.data.push(v), I.size += v.len, I.len += v.len, e.files) {
    var E = signFiles(e.files, n);
    if (E) {
      var L = {
        len: 4,
        size: 0,
        data: []
      };
      L.data.push(E), L.size += E.length, L.len += E.length;
      var z = {
        len: L.len + 12,
        size: L.len + 4,
        id: 16777729,
        value: L
      };
      I.data.push(z), I.size += z.len, I.len += z.len
    }
  }
  return I
}

function makeSignDataBuffer(e) {
  var t = Buffer.alloc(e.len),
    n = 0;
  return t.writeInt32LE(e.digests.size, n), n += 4, e.digests.data.forEach(function(e) {
    e.buffer.copy(t, n), n += e.len
  }), t.writeInt32LE(e.certs.size, n), n += 4, e.certs.data.forEach(function(e) {
    e.buffer.copy(t, n), n += e.len
  }), t.writeInt32LE(e.additional, n), t
}

function saveSignChunk(e) {
  var t = Buffer.alloc(e.len),
    n = 0;
  return t.writeInt32LE(e.size, n), n += 4, t.writeInt32LE(0, n), n += 4, e.data.forEach(function(e) {
    t.writeInt32LE(e.size, n), n += 4, t.writeInt32LE(0, n), n += 4, t.writeInt32LE(e.id, n), n += 4, t.writeInt32LE(e.value.size, n), n += 4, 16777473 === e.id ? e.value.data.forEach(function(e) {
      t.writeInt32LE(e.size, n), n += 4, t.writeInt32LE(e.signdata.size, n), n += 4, e.signdata.buffer.copy(t, n), n += e.signdata.buffer.length, t.writeInt32LE(e.signatures.size, n), n += 4, e.signatures.data.forEach(function(e) {
        t.writeInt32LE(e.size, n), n += 4, t.writeInt32LE(e.id, n), n += 4, t.writeInt32LE(e.buffer.length, n), n += 4, e.buffer.copy(t, n), n += e.buffer.length
      }), t.writeInt32LE(e.pubkey.size, n), n += 4, e.pubkey.buffer.copy(t, n), n += e.pubkey.buffer.length
    }) : 16777729 === e.id && e.value.data.forEach(function(e) {
      e.copy(t, n), n += e.length
    })
  }), t.writeInt32LE(e.size, n), n += 4, t.writeInt32LE(0, n), n += 4, Buffer.from(SigMagic).copy(t, n), t
}

function makeSignFile(e) {
  var t = _path2.default.extname(e),
    n = _path2.default.dirname(e),
    r = _path2.default.basename(e, t);
  return _path2.default.join(n, r + ".signed" + t)
}

function saveChunk(e, t, n) {
  var r = Buffer.alloc(e.length + t.signchunk.length),
    i = 0,
    a = t.sections;
  e.copy(r, i, a.header.startIndex, a.header.startIndex + a.header.len), i += a.header.len, t.signchunk.copy(r, i), i += t.signchunk.length, e.copy(r, i, a.central.startIndex, a.central.startIndex + a.central.len), i += a.central.len, e.writeInt32LE(a.central.startIndex + t.signchunk.length, a.footer.startIndex + 16), e.copy(r, i, a.footer.startIndex, a.footer.startIndex + a.footer.len), i += a.footer.len, _fs2.default.writeFileSync(n, r)
}

function signFiles(e, t, n) {
  var r = {
    len: 8,
    size: 4,
    digests: [],
    sign: null
  };
  return e.forEach(function(e) {
    var t = _signature2.default.CRC32.digest(e.name.toString()),
      n = 6 + e.hash.length,
      i = Buffer.alloc(n),
      a = 0;
    i.writeInt32LE(t, a), a += 4, i.writeInt16LE(e.hash.length, a), a += 2, e.hash.copy(i, a), a += e.hash.length, r.digests.push(i), r.size += n, r.len += n
  }), signDigestChunk(r, t), saveDigestChunk(r, n)
}

function signDigestChunk(e, t) {
  var n = Buffer.alloc(e.size),
    r = 0;
  n.writeInt32LE(259, r), r += 4, e.digests.forEach(function(e) {
    e.copy(n, r), r += e.length
  }), e.digests = n.slice();
  var i = _crypto2.default.createSign("RSA-SHA256");
  i.update(n);
  var a = i.sign(t);
  e.sign = {
    len: 12 + a.length,
    size: 8 + a.length,
    id: 259,
    data: a
  }, e.len += e.sign.len
}

function saveDigestChunk(e, t) {
  var n = Buffer.alloc(e.len),
    r = 0;
  return n.writeInt32LE(e.size, r), r += 4, e.digests.copy(n, r), r += e.digests.length, n.writeInt32LE(e.sign.size, r), r += 4, n.writeInt32LE(e.sign.id, r), r += 4, n.writeInt32LE(e.sign.data.length, r), r += 4, e.sign.data.copy(n, r), r += e.sign.data.length, t && _fs2.default.writeFileSync(t, n), n
}
var _fs = require("fs"),
  _fs2 = _interopRequireDefault(_fs),
  _path = require("path"),
  _path2 = _interopRequireDefault(_path),
  _crypto = require("crypto"),
  _crypto2 = _interopRequireDefault(_crypto),
  _signature = require("./signature"),
  _signature2 = _interopRequireDefault(_signature),
  _jsrsasign = require("jsrsasign"),
  _jsrsasign2 = _interopRequireDefault(_jsrsasign),
  _util = require("util"),
  SigMagic = "RPK Sig Block 42";
module.exports = {
  signZip: signZip,
  hashFile: hashFile
};
