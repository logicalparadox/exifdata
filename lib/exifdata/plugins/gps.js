/*!
 * ExifData - GPS Data Plugin
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

var parser = require('../parser')
  , util = require('../util');

/*!
 * All possible (gps) tags stored
 * at the exif level storage.
 */

var TAGS = {
    0x0000 : 'GPSVersionID'
  , 0x0001 : 'GPSLatitudeRef'
  , 0x0002 : 'GPSLatitude'
  , 0x0003 : 'GPSLongitudeRef'
  , 0x0004 : 'GPSLongitude'
  , 0x0005 : 'GPSAltitudeRef'
  , 0x0006 : 'GPSAltitude'
  , 0x0007 : 'GPSTimeStamp'
  , 0x0008 : 'GPSSatellites'
  , 0x0009 : 'GPSStatus'
  , 0x000A : 'GPSMeasureMode'
  , 0x000B : 'GPSDOP'
  , 0x000C : 'GPSSpeedRef'
  , 0x000D : 'GPSSpeed'
  , 0x000E : 'GPSTrackRef'
  , 0x000F : 'GPSTrack'
  , 0x0010 : 'GPSImgDirectionRef'
  , 0x0011 : 'GPSImgDirection'
  , 0x0012 : 'GPSMapDatum'
  , 0x0013 : 'GPSDestLatitudeRef'
  , 0x0014 : 'GPSDestLatitude'
  , 0x0015 : 'GPSDestLongitudeRef'
  , 0x0016 : 'GPSDestLongitude'
  , 0x0017 : 'GPSDestBearingRef'
  , 0x0018 : 'GPSDestBearing'
  , 0x0019 : 'GPSDestDistanceRef'
  , 0x001A : 'GPSDestDistance'
  , 0x001B : 'GPSProcessingMethod'
  , 0x001C : 'GPSAreaInformation'
  , 0x001D : 'GPSDateStamp'
  , 0x001E : 'GPSDifferential'
};

/**
 * Given the line (entry) specifying the
 * location of nested gps data, pull
 * data from raw and parse new lines. Finalize
 * by modifying the result object.
 *
 * @param {Buffers} raw (readonly)
 * @param {Object} result to modify
 * @param {Object} entry specifing location
 * @param {Boolean} big endian
 * @api public
 */

module.exports = function (raw, res, en, be) {
  var bufs = new Buffers()
    , gps = []
    , val = en.value
    , i = 0
    , entry;

  // pull out entry count and buffer of objects
  var count = util.getShort(raw.slice(val, val + 2), be)
    , subset = raw.slice(val + 2, (val + 2) * (12 * count))

  bufs.push(subset);

  for (; i < count; i++) {
    entry = parser(raw, bufs.splice(0, 12), be);
    gps.push(entry);
  }

  res.gps = {};

  gps.forEach(function (line) {
    var tag = TAGS[line.tag];
    res.gps[tag] = line.value;
  });
};
