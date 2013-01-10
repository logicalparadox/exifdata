/*!
 * ExifData - Exif Data Plugin
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
 * All possible (exif) tags stored
 * at the exif level storage.
 */

var TAGS = {
    0x829A : 'ExposureTime'
  , 0x829D : 'FNumber'
  , 0x8822 : 'ExposureProgram'
  , 0x8824 : 'SpectralSensitivity'
  , 0x8827 : 'ISOSpeedRatings'
  , 0x8828 : 'OECF'
  , 0x9000 : 'ExifVersion'
  , 0x9003 : 'DateTimeOriginal'
  , 0x9004 : 'DateTimeDigitized'
  , 0x9101 : 'ComponentsConfiguration'
  , 0x9102 : 'CompressedBitsPerPixel'
  , 0x9201 : 'ShutterSpeedValue'
  , 0x9202 : 'ApertureValue'
  , 0x9203 : 'BrightnessValue'
  , 0x9204 : 'ExposureBiasValue'
  , 0x9205 : 'MaxApertureValue'
  , 0x9206 : 'SubjectDistance'
  , 0x9207 : 'MeteringMode'
  , 0x9208 : 'LightSource'
  , 0x9209 : 'Flash'
  , 0x920A : 'FocalLength'
  , 0x9214 : 'SubjectArea'
  , 0x927C : 'MakerNote'
  , 0x9286 : 'UserComment'
  , 0x9290 : 'SubsecTime'
  , 0x9291 : 'SubsecTimeOriginal'
  , 0x9292 : 'SubsecTimeDigitized'
  , 0xA000 : 'FlashpixVersion'
  , 0xA001 : 'ColorSpace'
  , 0xA002 : 'PixelXDimension'
  , 0xA003 : 'PixelYDimension'
  , 0xA004 : 'RelatedSoundFile'
  , 0xA005 : 'Interoperability IFD'
  , 0xA20B : 'FlashEnergy'
  , 0xA20C : 'SpatialFrequencyResponse'
  , 0xA20E : 'FocalPlaneXResolution'
  , 0xA20F : 'FocalPlaneYResolution'
  , 0xA210 : 'FocalPlaneResolutionUnit'
  , 0xA214 : 'SubjectLocation'
  , 0xA215 : 'ExposureIndex'
  , 0xA217 : 'SensingMethod'
  , 0xA300 : 'FileSource'
  , 0xA301 : 'SceneType'
  , 0xA302 : 'CFAPattern'
  , 0xA401 : 'CustomRendered'
  , 0xA402 : 'ExposureMode'
  , 0xA403 : 'WhiteBalance'
  , 0xA404 : 'DigitalZoomRatio'
  , 0xA405 : 'FocalLengthIn35mmFilm'
  , 0xA406 : 'SceneCaptureType'
  , 0xA407 : 'GainControl'
  , 0xA408 : 'Contrast'
  , 0xA409 : 'Saturation'
  , 0xA40A : 'Sharpness'
  , 0xA40B : 'DeviceSettingDescription'
  , 0xA40C : 'SubjectDistanceRange'
  , 0xA420 : 'ImageUniqueID'
};

/**
 * Given the line (entry) specifying the
 * location of nested exif data, pull
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
    , exif = []
    , val = en.value
    , i = 0
    , entry;

  // pull out entry count and buffer of objects
  var count = util.getShort(raw.slice(val, val + 2), be)
    , subset = raw.slice(val + 2, (val + 2) * (12 * count))

  bufs.push(subset);

  for (; i < count; i++) {
    entry = parser(raw, bufs.splice(0, 12), be);
    exif.push(entry);
  }

  res.exif = {};

  exif.forEach(function (line) {
    var tag = TAGS[line.tag];
    res.exif[tag] = line.value;
  });
};
