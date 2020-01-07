var WebSocket = require('websocket').w3cwebsocket;
var DEBUG = true;

function TafHandler() {
  var w,
    j = this,
    k = 0;
  function l() {
    var destroyed = false;
    var a = 'ws://ws.api.huya.com:80';
    DEBUG && console.info('connecting ' + a),
      (w = new WebSocket(a)),
      (w.onopen = v),
      (w.onclose = p),
      (w.onerror = d),
      (w.onmessage = b);
  }
  function g(a) {
    w.send(a);
  }
  function v() {
    DEBUG && console.log('=== WebSocket Connected ==='),
      (k = 0),
      (j.connected = !0),
      j.dispatch('connect');
  }
  function p(a) {
    j.connected = !1;
    j.dispatch('close');
  }
  function d(a) {
    j.dispatch('error', a);
    DEBUG && console.warn('%c=== WebSocket Error ===', 'font-size:120%', a);
  }
  function b(A) {
    A = A.data;
    var y = new Taf.JceInputStream(A),
      E = new HUYA.WebSocketCommand();
    switch ((E.readFrom(y), E.iCmdType)) {
      case HUYA.EWebSocketCommandType.EWSCmd_RegisterRsp:
        y = new Taf.JceInputStream(E.vData.buffer);
        var C = new HUYA.WSRegisterRsp();
        C.readFrom(y),
          DEBUG && console.log('<<<<<<< rspRegister', C),
          j.dispatch('rawdata', { cmd: 'WSRegisterRsp', data: C });
        break;
      case HUYA.EWebSocketCommandType.EWSCmd_WupRsp:
        var x = new Taf.Wup();
        x.decode(E.vData.buffer);
        var c = TafMx.WupMapping[x.sFuncName];
        if (c) {
          c = new c();
          var F = x.newdata.get('tRsp') ? 'tRsp' : 'tResp';
          x.readStruct(F, c, TafMx.WupMapping[x.sFuncName]),
            DEBUG && console.log('<<<<<<< rspWup: ' + x.sFuncName),
            j.dispatch('rawdata', { cmd: x.sFuncName, data: c });
        } else {
          j.dispatch('rawdata', { cmd: x.sFuncName });
        }
        break;
      case HUYA.EWebSocketCommandType.EWSCmdS2C_MsgPushReq:
        y = new Taf.JceInputStream(E.vData.buffer);
        var z = new HUYA.WSPushMessage();
        z.readFrom(y), (y = new Taf.JceInputStream(z.sMsg.buffer));
        var D = TafMx.UriMapping[z.iUri];
        D &&
          ((D = new D()),
          D.readFrom(y),
          DEBUG && console.log('<<<<<<< rspMsgPush, iUri=' + z.iUri, D),
          j.dispatch('rawdata', { cmd: z.iUri, data: D }));
        break;
      case HUYA.EWebSocketCommandType.EWSCmdS2C_HeartBeatAck:
        DEBUG && console.log('<<<<<<< rspHeartBeat: ' + new Date().getTime());
        break;
      case HUYA.EWebSocketCommandType.EWSCmdS2C_VerifyCookieRsp:
        y = new Taf.JceInputStream(E.vData.buffer);
        var i = new HUYA.WSVerifyCookieRsp();
        i.readFrom(y);
        var B = 0 == i.iValidate;
        DEBUG &&
          console.log('<<<<<<< VerifyCookie', '校验' + (B ? '通过！' : '失败！'), i);
        break;
      default:
        DEBUG && console.warn('<<<<<<< Not matched CmdType: ' + E.iCmdType);
    }
  }
  function m(a) {
    return 'color:' + a + ';font-weight:900';
  }
  this.connected = !1;
  l(),
    (this.sendWup = function(u, f, c) {
      var x = new Taf.Wup();
      x.setServant(u), x.setFunc(f), x.writeStruct('tReq', c);
      var n = new HUYA.WebSocketCommand();
      (n.iCmdType = HUYA.EWebSocketCommandType.EWSCmd_WupReq),
        (n.vData = x.encode());
      var i = new Taf.JceOutputStream();
      n.writeTo(i),
        g(i.getBuffer()),
        DEBUG &&
          console.log(
            '%c>>>>>>> %creqWup: %c' + f,
            m('#009100'),
            m('black'),
            m('#009100'),
            c
          );
    }),
    (this.sendRegister = function(i) {
      var f = new Taf.JceOutputStream();
      i.writeTo(f);
      var c = new HUYA.WebSocketCommand();
      (c.iCmdType = HUYA.EWebSocketCommandType.EWSCmd_RegisterReq),
        (c.vData = f.getBinBuffer()),
        (f = new Taf.JceOutputStream()),
        c.writeTo(f),
        g(f.getBuffer()),
        DEBUG &&
          console.log(
            '%c>>>>>>> %creqRegister:',
            m('#009100'),
            m('#D26900'),
            i
          );
    });
  var q = {};
  (this.addListener = function(a, c) {
    return (
      'undefined' == typeof q[a] && (q[a] = []),
      'function' == typeof c && q[a].push(c),
      this
    );
  }),
    (this.dispatch = function(i, s) {
      var f = q[i];
      if (f instanceof Array) {
        for (var c = 0, r = f.length; r > c; c += 1) {
          'function' == typeof f[c] && f[c](s);
        }
        0 == f.length;
      }
      return this;
    }),
    (this.removeListener = function(i, s) {
      var f = q[i];
      if ('string' == typeof i && f instanceof Array) {
        if ('function' == typeof s) {
          for (var c = 0, r = f.length; r > c; c += 1) {
            if (f[c].fn === s) {
              q[i].splice(c, 1);
              break;
            }
          }
        } else {
          delete q[i];
        }
      }
      return this;
    }),
    (this.destroy = function() {
      w.destroy = true;
      w.onopen = null;
      w.onclose = null;
      w.onerror = null;
      w.onmessage = null;
      w.close();
    });
}

module.exports = TafHandler