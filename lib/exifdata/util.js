var Buffers = require('bufs');

exports.toBufs = function (_buf) {
  var buf;

  if (_buf instanceof Buffer) {
    buf = new Buffers();
    buf.push(_buf);
  } else {
    buf = _buf;
  }

  return buf;
};

exports.get = function (buf, len) {
  return buf.splice(0, len).slice();
};

exports.getShort = function (_buf, be) {
  var buf = exports.toBufs(_buf)
    , bits = exports.get(buf, 2)
    , val = be
      ? (bits[0] << 8) + bits[1]
      : (bits[1] << 8) + bits[0];

  return val < 0
    ? val + 65536
    : val;
};

exports.getLong = function (_buf, be) {
  var buf = exports.toBufs(_buf)
    , bits = exports.get(buf, 4)
    , val = be
      ? (bits[0] << 8) + (bits[1] << 8) + (bits[2] << 8) + bits[3]
      : (bits[3] << 8) + (bits[2] << 8) + (bits[1] << 8) + bits[0]

  return val < 0
    ? val + 4294967296
    : val;
};

exports.getString = function (_buf, len) {
  var buf = exports.toBufs(_buf)
    , i = 0
    , str = []
    , code;

  for (; i < len; i++) {
    code = exports.get(buf, 1)[0];
    str.push(String.fromCharCode(code));
  }

  return str.join('');
};

