"use strict";

function _interopRequireDefault(e) {
  return e && e.__esModule ? e : {
    default: e
  }
}

function getIPAdress() {
  var e = require("os").networkInterfaces();
  for (var t in e)
    for (var r = e[t], a = 0; a < r.length; a++) {
      var i = r[a];
      if ("IPv4" === i.family && "127.0.0.1" !== i.address && !i.internal) return i.address
    }
}

function getClientIPAdress(e) {
  return e.headers["x-forwarded-for"] || e.connection.remoteAddress || e.socket.remoteAddress || e.connection.socket.remoteAddress
}

function getProjectName() {
  var e = _path2.default.join(__dirname, "../../../src/manifest.json"),
    t = JSON.parse(_fs2.default.readFileSync(e));
  return t && t.package || "Bundle"
}

function outputQRCodeOnTerminal(e) {
  console.info(""), console.info("生成HTTP服务器的二维码: " + e), _qrcodeTerminal2.default.generate(e, {
    small: !0
  })
}
var _http = require("http"),
  _http2 = _interopRequireDefault(_http),
  _url = require("url"),
  _url2 = _interopRequireDefault(_url),
  _fs = require("fs"),
  _fs2 = _interopRequireDefault(_fs),
  _path = require("path"),
  _path2 = _interopRequireDefault(_path),
  _qrImage = require("qr-image"),
  _qrImage2 = _interopRequireDefault(_qrImage),
  _yargs = require("yargs"),
  _yargs2 = _interopRequireDefault(_yargs),
  _qrcodeTerminal = require("qrcode-terminal"),
  _qrcodeTerminal2 = _interopRequireDefault(_qrcodeTerminal),
  argv = _yargs2.default.argv,
  PORT = argv.port || 12306,
  mime = {
    css: "text/css",
    gif: "image/gif",
    html: "text/html",
    ico: "image/x-icon",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    js: "text/javascript",
    json: "application/json",
    pdf: "application/pdf",
    png: "image/png",
    svg: "image/svg+xml",
    swf: "application/x-shockwave-flash",
    tiff: "image/tiff",
    txt: "text/plain",
    wav: "audio/x-wav",
    wma: "audio/x-ms-wma",
    wmv: "video/x-ms-wmv",
    xml: "text/xml"
  },
  server = _http2.default.createServer(function(e, t) {
    console.log("### App Server ### Received request: " + e.url);
    var r = getClientIPAdress(e);
    console.log("### App Server ### Client: " + r);
    var a = _path2.default.join(__dirname, "client");
    _fs2.default.writeFileSync(a, JSON.stringify({
      client: r,
      timestamp: new Date
    })), t.setHeader("Server", "NodeJS/NativeAPP");
    var i = _url2.default.parse(e.url).pathname,
      n = void 0;
    "/" === i.slice(-1) ? n = "/" : "/bundle" === i.toLowerCase() ? (n = _path2.default.join(__dirname, "../../../dist", getProjectName() + ".rpk"), _fs2.default.existsSync(n) || (n = _path2.default.join(__dirname, "../../../dist", getProjectName() + ".signed.rpk"))) : n = _path2.default.join(__dirname, "../../../build", _path2.default.normalize(i.replace(/\.\./g, "")));
    ! function e(r) {
      if ("/" === r) {
        var a = "http://" + getIPAdress() + ":" + PORT,
          n = _qrImage2.default.image(a, {
            size: 10
          });
        t.writeHead(200, {
          "Content-Type": "image/png"
        }), n.pipe(t)
      } else _fs2.default.stat(r, function(a, n) {
        if (a) t.writeHead(404, "Not Found", {
          "Content-Type": "text/plain"
        }), t.write("The request URL --" + i + "-- was not found"), t.end();
        else if (n.isDirectory()) r = "/", e(r);
        else {
          var o = _path2.default.extname(r);
          o = o ? o.slice(1) : "unknown";
          var s = mime[o] || "text/plain";
          t.setHeader("Content-Type", s);
          var l = n.mtime.toUTCString();
          t.setHeader("Last-Modified", l);
          var u = _fs2.default.createReadStream(r);
          t.writeHead(200, "Ok"), u.pipe(t)
        }
      })
    }(n)
  });
server.listen(PORT, "0.0.0.0", function() {
  outputQRCodeOnTerminal("http://" + getIPAdress() + ":" + PORT)
}), console.log("### App Server ### Server running: port=" + PORT);
