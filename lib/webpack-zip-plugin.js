"use strict";

function _interopRequireDefault(e) {
  return e && e.__esModule ? e : {
    default: e
  }
}

function ZipPlugin(e) {
  this.options = e
}

function copyfile(e, i, t) {
  if (_fs2.default.existsSync(e)) {
    var a = _fs2.default.createReadStream(e),
      r = _fs2.default.createWriteStream(i);
    a.pipe(r), a.on("close", function () {
      r.end(), t(e, i)
    })
  }
}

function parse(e, i, t, a) {
  i = i || ".";
  var r = _path2.default.posix.join(e, i),
    s = void 0;
  a.readdirSync(r).forEach(function (n) {
    var o = _path2.default.posix.join(r, n),
      l = a.statSync(o);
    if (l.isFile()) {
      var u = i.split(_path2.default.sep).join(_path2.default.posix.sep);
      s = _path2.default.posix.join(u, _path2.default.basename(n)), t(s, o)
    } else if (l.isDirectory()) {
      var f = _path2.default.posix.join(i, n);
      parse(e, f, t, a)
    }
  })
}

function removeWebpackCode(e, i) {
  return /\.js$/.test(e) ? (/app\.js$/.test(e) && (i = i.replace(/\n\W__webpack_require__\(\d+\);\n/, "\n")), i) : i
}
var _fs = require("fs"),
  _fs2 = _interopRequireDefault(_fs),
  _path = require("path"),
  _path2 = _interopRequireDefault(_path),
  _archiver = require("archiver"),
  _archiver2 = _interopRequireDefault(_archiver),
  _bundle = require("./bundle"),
  _bundle2 = _interopRequireDefault(_bundle),
  _child_process = require("child_process"),
  _child_process2 = _interopRequireDefault(_child_process),
  _utils = require("./utils"),
  _shared = require("./shared"),
  exec = _child_process2.default.exec,
  projDir = _path2.default.join(__dirname, "../"),
  processDir = process.cwd(),
  signFiles = getSignFiles();

function getSignFiles(){
  const projectSign = _path2.default.resolve(process.cwd(), "sign/debug");
  const defaultSign = _path2.default.resolve(__dirname, "../sign/debug");
  const debugSign = _fs2.default.existsSync(projectSign) ? projectSign : defaultSign;

  return {
    debug: {
      privatekey: _path2.default.join(debugSign, "private.pem"),
      certificate: _path2.default.join(debugSign, "certificate.pem")
    },
    release: {
      privatekey: _path2.default.join(processDir, "sign/release/private.pem"),
      certificate: _path2.default.join(processDir, "sign/release/certificate.pem")
    }
  };
}
ZipPlugin.prototype.apply = function (e) {
  var i = this.options;
  signFiles.mode = signFiles.debug, e.plugin("watch-run", function (e, i) {
    Object.keys(this.options.entry).forEach(function (e) {
      var i = this.options.entry[e];
      i instanceof Array && !/app\.js/.test(e) && -1 !== i[0].indexOf("webpack-dev-server") && i.shift()
    }.bind(this)), i()
  }), e.plugin("done", function () {
    var e = this.outputFileSystem,
      t = i.sign;
    if (t && (signFiles.mode = signFiles.release), !_fs2.default.existsSync(signFiles.mode.privatekey)) return void _utils.colorconsole.log("### App Loader ### 缺少私钥文件, 打包失败: " + signFiles.mode.privatekey);
    if (!_fs2.default.existsSync(signFiles.mode.certificate)) return void _utils.colorconsole.log("### App Loader ### 缺少证书文件, 打包失败: " + signFiles.mode.certificate);
    var a = i.res,
      r = Object.keys(a).length,
      s = function (a, s) {
        if (/manifest\.json$/.test(s) && (0, _shared.updateProjectManifest)(s), !(--r > 0)) {
          _utils.colorconsole.log("### App Loader ### 编译完成, 生成压缩包"), (0, _utils.mkdirsSync)(i.output);
          var n = [],
            o = _path2.default.join(i.output, "bundle." + (new Date).getTime() + ".zip"),
            l = i.src;
          if (_fs2.default.existsSync(l)) {
            var u = _fs2.default.createWriteStream(o),
              f = (0, _archiver2.default)("zip");
            u.on("finish", function () {
              _utils.colorconsole.log("### App Loader ### 压缩包加签名");
              var e = _path2.default.join(i.output, i.name + ".rpk");
              t && (e = e.replace(/\.rpk$/, ".signed.rpk"));
              var a = _fs2.default.readFileSync(signFiles.mode.privatekey),
                r = _fs2.default.readFileSync(signFiles.mode.certificate);
              _bundle2.default.signZip({
                zip: o,
                files: n
              }, a, r, e), _fs2.default.existsSync(o) && _fs2.default.unlinkSync(o), exec("cd " + projDir + " && npm run notify", function (e, i, t) {
                e ? _utils.colorconsole.log("### App Loader ### 自动刷新执行build失败 :" + t) : _utils.colorconsole.log("### App Loader ### 自动刷新执行build :" + i)
              })
            }), f.on("error", function (e) {
              throw e
            }), f.pipe(u), e.readdirSync ? (parse("/", ".", function (i, t) {
              var a = removeWebpackCode(t, e.readFileSync(t).toString());
              void 0 !== a && (n.push({
                name: Buffer.from(i),
                file: t,
                hash: _bundle2.default.hashFile(t, e)
              }), f.append(a, {
                name: i
              }))
            }, e), parse(l, ".", function (e, i) {
              n.push({
                name: Buffer.from(e),
                file: i,
                hash: _bundle2.default.hashFile(i, _fs2.default)
              }), f.append(_fs2.default.createReadStream(i), {
                name: e
              })
            }, _fs2.default)) : parse(l, ".", function (e, i) {
              n.push({
                name: Buffer.from(e),
                file: i,
                hash: _bundle2.default.hashFile(i, _fs2.default)
              }), f.append(_fs2.default.createReadStream(i), {
                name: e
              })
            }, _fs2.default), f.finalize()
          }
        }
      };
    Object.keys(a).forEach(function (e) {
      var i = a[e],
        t = _path2.default.dirname(e);
      (0, _utils.mkdirsSync)(t), _fs2.default.existsSync(t) ? copyfile(i, e, s) : (_fs2.default.mkdirSync(t), copyfile(i, e, s))
    })
  })
}, module.exports = ZipPlugin;