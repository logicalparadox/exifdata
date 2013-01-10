/*!
 * ExifData - Util
 * Copyright(c) 2013 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module Dependencies
 */

var Buffers = require('bufs');

/**
 * Convert a Buffer to a `bufs` set
 * if it is not currently so. All utils
 * require a `bufs` set to operate.
 *
 * @param {Buffer|Buffers} object to check
 * @return {Buffers} result
 * @api public
 */

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

/**
 * Retrieve a count of bytes from
 * the beginning of a buffer. Will
 * remove bytes retrieved from the
 * original Buffers object.
 *
 * @param {Buffer|Buffers} buffer to splice
 * @param {Number} count of bytes to remove
 * @return {Buffer} result
 * @api public
 */

exports.get = function (_buf, len) {
  return exports
    .toBufs(_buf)
    .splice(0, len)
    .slice();
};

/**
 * Retrieve a short (2 bytes) from the
 * beginning of the passed buffer. Will
 * remove the bytes retrieved from the
 * original Buffers object.
 *
 * @param {Buffer|Buffers} buffer to splice
 * @param {Boolean} big endian
 * @return {Number} result
 */

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

/**
 * Retrieve a long (4 bytes) from the
 * beginning of the passed buffer. Will
 * remove the bytes retrieved from the
 * original Buffers object.
 *
 * @param {Buffer|Buffers} buffer to splice
 * @param {Boolean} big endian
 * @return {Number} result
 * @api public
 */

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

/**
 * Retrieve a string of defined length
 * from the beginning of the passed
 * buffer. Will remove the bytes
 * retrieved from the original Buffers
 * object.
 *
 * @param {Buffer|Buffers} buffer to splice
 * @param {Number} length
 * @return {String} result
 * @api public
 */

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

