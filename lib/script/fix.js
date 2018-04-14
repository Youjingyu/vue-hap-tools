"use strict";

function removeAllLoc(e) {
    function t(e) {
        if (Array.isArray(e)) e.forEach(t);
        else if ("object" === (void 0 === e ? "undefined" : _typeof(e)))
            for (var r in e) "loc" === r && delete e[r], "range" === r ? delete e[r] : "object" === _typeof(e[r]) && t(e[r])
    }
    return e = JSON.parse(JSON.stringify(e)), t(e), e
}

function findDataValue(e) {
    var t = void 0,
        r = void 0,
        o = void 0,
        n = void 0;
    return e && e.body && e.body.length && e.body.forEach(function (e) {
        "ExpressionStatement" === e.type && (t = e.expression, "AssignmentExpression" === t.type && "=" === t.operator && (r = removeAllLoc(t.left || {}), JSON.stringify(r) === JSON.stringify(LEFT_MODULE_EXPORTS_AST) && (o = t.right, "ObjectExpression" === o.type && o.properties.some(function (e) {
            if ("Property" === e.type && e.key && "data" === e.key.name && e.value && "ObjectExpression" === e.value.type) return n = e, !0
        }))))
    }), n
}

function convertValueAst(e) {
    return {
        type: "FunctionExpression",
        id: null,
        params: [],
        defaults: [],
        body: {
            type: "BlockStatement",
            body: [{
                type: "ReturnStatement",
                argument: e
            }]
        },
        generator: !1,
        expression: !1
    }
}

function format(e, t) {
    var r = esprima.parse(e),
        o = findDataValue(r);
    return o && (o.value = convertValueAst(o.value), t = !0), t ? escodegen.generate(r) : e
}

function formatBetter(e) {
    var t = esprima.parse(e, {
            range: !0
        }),
        r = findDataValue(t);
    if (r) {
        var o = r.value.range[0],
            n = r.value.range[1],
            i = n - o;
        return e.substr(0, o) + "function () {return " + e.substr(o, i) + "}" + e.substr(n)
    }
    return e
}
var _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (e) {
        return typeof e
    } : function (e) {
        return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
    },
    esprima = require("esprima"),
    escodegen = require("escodegen"),
    LEFT_MODULE_EXPORTS_AST = {
        type: "MemberExpression",
        computed: !1,
        object: {
            type: "Identifier",
            name: "module"
        },
        property: {
            type: "Identifier",
            name: "exports"
        }
    };
exports.fix = formatBetter, exports.formatWhenFix = format;