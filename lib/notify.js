"use strict";

function _interopRequireDefault(e) {
  return e && e.__esModule ? e : {
    default: e
  }
}
var _http = require("http"),
  _http2 = _interopRequireDefault(_http),
  _fs = require("fs"),
  _fs2 = _interopRequireDefault(_fs),
  _path = require("path"),
  _path2 = _interopRequireDefault(_path),
  PORT = 39517,
  clientPath = _path2.default.join(__dirname, "client");
if (_fs2.default.existsSync(clientPath)) {
  var client = JSON.parse(_fs2.default.readFileSync(clientPath).toString());
  if (client.client) {
    var requrl = "http://" + client.client + ":" + PORT + "/update";
    _http2.default.get(requrl, function(e) {
      console.log("### App Server ### Send Update Request Finished: " + requrl), e.resume()
    }).on("error", function(e) {
      console.log("### App Server ### Send Update Request error: " + e.message)
    })
  }
}
