/*!
 * ExifData - Parser
 * Copyright(c) 2013 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module Dependencies
 */

var Buffers = require('bufs');

/*!
 * Internal Dependencies
 */

var util = require('./util');

/**
 * Parse all possilbe types of data
 * that can be stored in the exif data
 * structure.
 *
 * @param {Buffer} all exif data (readonly)
 * @param {Buffer} exif entry line
 * @param {Boolean} big endian
 * @return {Object} exif entry
 */

module.exports = function parser (raw, _buf, be) {
  var buf = util.toBufs(_buf);

  var entry = {
      tag: util.getShort(buf, be)
    , format: util.getShort(buf, be)
    , count: util.getLong(buf, be)
    , value: null
  };

  switch (entry.format) {

    case 0x0001:
      parseByte(raw, buf, entry, be);
      break;

    case 0x0002: // ASCII-based string
      parseString(raw, buf, entry, be);
      break;

    case 0x0003:
      parseUShort(raw, buf, entry, be);
      break;

    case 0x0004: // unsigned longs
      parseULong(raw, buf, entry, be);
      break;

    case 0x00005: // unsigned rational
      parseURational(raw, buf, entry, be);
      break;
  }

  return entry;
}

/**
 * Parse exif data type 0x0001. Single
 * byte structure. Up to 4 bytes can be
 * stored in the line, or retrieve the
 * total count of bytes from elsewhere in
 * `raw`.
 *
 * @param {Buffer} raw exif data (readonly)
 * @param {Buffer} remaining line entry
 * @param {Object} entry to be updated
 * @param {Boolean} big endian
 * @api private
 */

function parseByte (raw, buf, en, be) {
  var count = en.count
    , i = 0
    , bytes, loc;

  if (count <= 4) {
    bytes = buf.slice();
  } else {
    loc = util.getLong(buf, be);
    bytes = raw.slice(loc, loc + count);
  }

  en.value = [];

  for (; i < count; i++) {
    en.value.push(bytes[i]);
  }

  if (en.value.length === 1) {
    en.value = en.value[0];
  }
}

/**
 * Parse exif data type 0x0002. Ascii
 * string structure. Up to 4 chars can be
 * stored in the line, or retrieve the
 * total count of characters from elsewhere in
 * `raw`.
 *
 * @param {Buffer} raw exif data (readonly)
 * @param {Buffer} remaining line entry
 * @param {Object} entry to be updated
 * @param {Boolean} big endian
 * @api private
 */

function parseString (raw, buf, en, be) {
  var count = en.count
    , len, loc, str;

  if (count <= 4) {
    en.value = util.getString(buf, count);
  } else {
    loc = util.getLong(buf, be);
    str = raw.slice(loc, loc + count);
    en.value = util.getString(str, str.length);
  }

  len = en.value.length;

  if (en.value[len - 1] === '\u0000') {
    en.value = en.value.substr(0, len - 1);
  }
}

/**
 * Parse exif data type 0x0003. Unsigned
 * short byte structure. Up to 2 shorts can be
 * stored in the line, or retrieve the
 * total count of shorts from elsewhere in
 * `raw`.
 *
 * @param {Buffer} raw exif data (readonly)
 * @param {Buffer} remaining line entry
 * @param {Object} entry to be updated
 * @param {Boolean} big endian
 * @api private
 */

function parseUShort (raw, buf, en, be) {
  var count = en.count

  if (count <= 2) {
    en.value = [ util.getShort(buf, be) ];
  } else {
    var loc = util.getLong(buf, be)
      , subset = raw.slice(loc, loc + (2 * count))
      , vals = new Buffers()
      , i = 0;

    vals.push(subset); // convert to buffers
    en.value = [];

    for (; i < count; i ++) {
      en.value.push(util.getShort(vals, be));
    }
  }

  if (en.value.length === 1) {
    en.value = en.value[0];
  }
}

/**
 * Parse exif data type 0x0004. Unsigned
 * long byte structure. One long can be
 * stored in the line, or retrieve the
 * total count of longs from elsewhere in
 * `raw`.
 *
 * @param {Buffer} raw exif data (readonly)
 * @param {Buffer} remaining line entry
 * @param {Object} entry to be updated
 * @param {Boolean} big endian
 * @api private
 */

function parseULong (raw, buf, en, be) {
  var count = en.count

  if (count === 1) {
    en.value = [ util.getLong(buf, be) ];
  } else {
    var loc = util.getLong(buf, be)
      , subset = raw.slice(loc, loc + (4 * count))
      , vals = new Buffers()
      , i = 0;

    vals.push(subset); // convert to buffers
    en.value = [];

    for (; i < count; i ++) {
      en.value.push(util.getLong(vals, be));
    }
  }

  if (en.value.length === 1) {
    en.value = en.value[0];
  }
}

/**
 * Parse exif data type 0x0005. Unsigned
 * rational (fraction) structure. A
 * rational is 2 longs; a numerator and
 * a denominator that are to be divided.
 * All rationals must be retrieved from
 * elsewhere in `raw`.
 *
 * @param {Buffer} raw exif data (readonly)
 * @param {Buffer} remaining line entry
 * @param {Object} entry to be updated
 * @param {Boolean} big endian
 * @api private
 */

function parseURational (raw, buf, en, be) {
  var count = en.count
    , loc = util.getLong(buf, be)
    , subset = raw.slice(loc, loc + (8 * count))
    , vals = new Buffers()
    , i = 0;

  vals.push(subset);
  en.value = [];

  for (; i < count; i++) {
    en.value.push(
        util.getLong(vals, be)
      / util.getLong(vals, be)
    );
  }

  if (en.value.length === 1) {
    en.value = en.value[0];
  }
}
