/*!
 * ExifData - Extract
 * Copyright(c) 2013 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module Dependencies
 */

var Buffers = require('bufs')
  , read = require('fs').readFile

/*!
 * Internal Dependencies
 */

var util = require('./util')
  , parser = require('./parser')
  , plugins = require('./plugins');

/**
 * ### .extract (buffer, cb)
 *
 * Extract the Exif data from a JPEG buffer.
 *
 * @param {Buffer|String} input buffer or file
 * @param {Function} callback
 * @cb {Error|null} if error
 * @cb {Object} exif data
 * @api public
 */

module.exports = function (_buf, cb) {
  if ('string' === typeof _buf) {
    read(_buf, function (err, buf) {
      if (err) return cb(err);
      beginExtract(buf, cb);
    });
  } else {
    process.nextTick(function () {
      beginExtract(_buf, cb);
    });
  }
};

function beginExtract (_buf, cb) {
  var buf = new Buffers()
    , res = {};

  buf.push(_buf);

  var isJPEG = util.get(buf, 2)
    , exifLen
    , exif
    , header;

  if (isJPEG[0] !== 0xFF && isJPEG[1] !== 0xD8) {
    return cb(new Error('Not valid JPEG file.'));
  }

  res.type = 'JPEG';

  while (buf.length) {
    // exit on bad data
    if (util.get(buf, 1)[0] !== 0xFF) {
      return cb(new Error('Invalid EXIF data.'));
    }

    header = util.get(buf, 1);
    if (header[0] === 0xE1) {
      exifLen = util.getShort(buf, true);
      exif = buf.splice(0, exifLen - 2);
      try { extractExif( exif, res); }
      catch (ex) { return cb(ex); }
    } else if (header[0] === 0xDA) {
      // rest of file is actual image.
      break;
    } else {
      buf.splice(0, util.getShort(buf, true) - 2);
    }
  }

  return cb(null, res);
}

/*!
 * When the exif data portion of the buffer
 * is found it will be passed to this function
 * for actual parsing.
 *
 * @param {Buffer} file buffer starting at exif
 * @param {Object} result object to be modified
 * @api private
 */

function extractExif (raw, res) {
  var isExif = util.get(raw, 6)
    , be, tiff, tiffHead;

  // confirm valid exif data
  if ('Exif\0\0' !== isExif.toString('utf8')) {
    throw new Error('Invalid EXIF data');
  }

  tiff = util.getShort(raw.slice(0, 2));

  // extract endian-ness (II vs. MM)
  if (tiff === 0x4949) {
    be = false;
  } else if (tiff === 0x4D4D) {
    be = true;
  } else {
    throw new Error('Invalid TIFF endianness.');
  }

  tiffHead = util.getShort(raw.slice(2, 4), be);

  // ensure remainder of tiff header
  if (tiffHead !== 0x002A) {
    throw new Error('Invalid TIFF header.');
  }

  var bufs = new Buffers()
    , offset = util.getLong(raw.slice(4, 8), be)
    , entries = []
    , i = 0
    , entry, len

  // pull out entry count and buffer of objects
  var count = util.getShort(raw.slice(offset, offset + 2), be)
    , subset = raw.slice(offset + 2, (offset + 2) * (12 * count));

  bufs.push(subset);

  for(; i < count; i++) {
    entry = parser(raw, bufs.splice(0, 12), be);
    entries.push(entry);
  }

  res.tiff = {};

  entries.forEach(function (line) {
    var tag = line.tag

    if (tag === 0x8825) {
      plugins.gps(raw, res, line, be);
    } else if (tag === 0x8769) {
      plugins.exif(raw, res, line, be);
    } else {
      var name = TAGS[tag];
      res.tiff[name] = line.value;
    }

  });
}

/*!
 * All (TIFF) tags that are possible at the
 * top level of the exif data structure.
 */

var TAGS = {
    0x00FE : 'NewSubfileType'
  , 0x00FF : 'SubfileType'
  , 0x0100 : 'ImageWidth'
  , 0x0101 : 'ImageLength'
  , 0x0102 : 'BitsPerSample'
  , 0x0103 : 'Compression'
  , 0x0106 : 'PhotometricInterpretation'
  , 0x0107 : 'Threshholding'
  , 0x0108 : 'CellWidth'
  , 0x0109 : 'CellLength'
  , 0x010A : 'FillOrder'
  , 0x010E : 'ImageDescription'
  , 0x010F : 'Make'
  , 0x0110 : 'Model'
  , 0x0111 : 'StripOffsets'
  , 0x0112 : 'Orientation'
  , 0x0115 : 'SamplesPerPixel'
  , 0x0116 : 'RowsPerStrip'
  , 0x0117 : 'StripByteCounts'
  , 0x0118 : 'MinSampleValue'
  , 0x0119 : 'MaxSampleValue'
  , 0x011A : 'XResolution'
  , 0x011B : 'YResolution'
  , 0x011C : 'PlanarConfiguration'
  , 0x0120 : 'FreeOffsets'
  , 0x0121 : 'FreeByteCounts'
  , 0x0122 : 'GrayResponseUnit'
  , 0x0123 : 'GrayResponseCurve'
  , 0x0128 : 'ResolutionUnit'
  , 0x0131 : 'Software'
  , 0x0132 : 'DateTime'
  , 0x013B : 'Artist'
  , 0x013C : 'HostComputer'
  , 0x0140 : 'ColorMap'
  , 0x0152 : 'ExtraSamples'
  , 0x8298 : 'Copyright'
  , 0x010D : 'DocumentName'
  , 0x011D : 'PageName'
  , 0x011E : 'XPosition'
  , 0x011F : 'YPosition'
  , 0x0124 : 'T4Options'
  , 0x0125 : 'T6Options'
  , 0x0129 : 'PageNumber'
  , 0x012D : 'TransferFunction'
  , 0x013D : 'Predictor'
  , 0x013E : 'WhitePoint'
  , 0x013F : 'PrimaryChromaticities'
  , 0x0141 : 'HalftoneHints'
  , 0x0142 : 'TileWidth'
  , 0x0143 : 'TileLength'
  , 0x0144 : 'TileOffsets'
  , 0x0145 : 'TileByteCounts'
  , 0x0146 : 'BadFaxLines'
  , 0x0147 : 'CleanFaxData'
  , 0x0148 : 'ConsecutiveBadFaxLines'
  , 0x014A : 'SubIFDs'
  , 0x014C : 'InkSet'
  , 0x014D : 'InkNames'
  , 0x014E : 'NumberOfInks'
  , 0x0150 : 'DotRange'
  , 0x0151 : 'TargetPrinter'
  , 0x0153 : 'SampleFormat'
  , 0x0154 : 'SMinSampleValue'
  , 0x0155 : 'SMaxSampleValue'
  , 0x0156 : 'TransferRange'
  , 0x0157 : 'ClipPath'
  , 0x0158 : 'XClipPathUnits'
  , 0x0159 : 'YClipPathUnits'
  , 0x015A : 'Indexed'
  , 0x015B : 'JPEGTables'
  , 0x015F : 'OPIProxy'
  , 0x0190 : 'GlobalParametersIFD'
  , 0x0191 : 'ProfileType'
  , 0x0192 : 'FaxProfile'
  , 0x0193 : 'CodingMethods'
  , 0x0194 : 'VersionYear'
  , 0x0195 : 'ModeNumber'
  , 0x01B1 : 'Decode'
  , 0x01B2 : 'DefaultImageColor'
  , 0x0200 : 'JPEGProc'
  , 0x0201 : 'JPEGInterchangeFormat'
  , 0x0202 : 'JPEGInterchangeFormatLength'
  , 0x0203 : 'JPEGRestartInterval'
  , 0x0205 : 'JPEGLosslessPredictors'
  , 0x0206 : 'JPEGPointTransforms'
  , 0x0207 : 'JPEGQTables'
  , 0x0208 : 'JPEGDCTables'
  , 0x0209 : 'JPEGACTables'
  , 0x0211 : 'YCbCrCoefficients'
  , 0x0212 : 'YCbCrSubSampling'
  , 0x0213 : 'YCbCrPositioning'
  , 0x0214 : 'ReferenceBlackWhite'
  , 0x022F : 'StripRowCounts'
  , 0x02BC : 'XMP'
  , 0x800D : 'ImageID'
  , 0x87AC : 'ImageLayer'
  , 0x80A4 : 'Wang Annotation'
  , 0x82A5 : 'MD FileTag'
  , 0x82A6 : 'MD ScalePixel'
  , 0x82A7 : 'MD ColorTable'
  , 0x82A8 : 'MD LabName'
  , 0x82A9 : 'MD SampleInfo'
  , 0x82AA : 'MD PrepDate'
  , 0x82AB : 'MD PrepTime'
  , 0x82AC : 'MD FileUnits'
  , 0x830E : 'ModelPixelScaleTag'
  , 0x83BB : 'IPTC'
  , 0x847E : 'INGR Packet Data Tag'
  , 0x847F : 'INGR Flag Registers'
  , 0x8480 : 'IrasB Transformation Matrix'
  , 0x8482 : 'ModelTiepointTag'
  , 0x85D8 : 'ModelTransformationTag'
  , 0x8649 : 'Photoshop'
  , 0x8769 : 'Exif IFD'
  , 0x8773 : 'ICC Profile'
  , 0x87AF : 'GeoKeyDirectoryTag'
  , 0x87B0 : 'GeoDoubleParamsTag'
  , 0x87B1 : 'GeoAsciiParamsTag'
  , 0x8825 : 'GPS IFD'
  , 0x885C : 'HylaFAX FaxRecvParams'
  , 0x885D : 'HylaFAX FaxSubAddress'
  , 0x885E : 'HylaFAX FaxRecvTime'
  , 0x935C : 'ImageSourceData'
  , 0xA005 : 'Interoperability IFD'
  , 0xA480 : 'GDAL_METADATA'
  , 0xA481 : 'GDAL_NODATA'
  , 0xC427 : 'Oce Scanjob Description'
  , 0xC428 : 'Oce Application Selector'
  , 0xC429 : 'Oce Identification Number'
  , 0xC42A : 'Oce ImageLogic Characteristics'
  , 0xC612 : 'DNGVersion'
  , 0xC613 : 'DNGBackwardVersion'
  , 0xC614 : 'UniqueCameraModel'
  , 0xC615 : 'LocalizedCameraModel'
  , 0xC616 : 'CFAPlaneColor'
  , 0xC617 : 'CFALayout'
  , 0xC618 : 'LinearizationTable'
  , 0xC619 : 'BlackLevelRepeatDim'
  , 0xC61A : 'BlackLevel'
  , 0xC61B : 'BlackLevelDeltaH'
  , 0xC61C : 'BlackLevelDeltaV'
  , 0xC61D : 'WhiteLevel'
  , 0xC61E : 'DefaultScale'
  , 0xC61F : 'DefaultCropOrigin'
  , 0xC620 : 'DefaultCropSize'
  , 0xC621 : 'ColorMatrix1'
  , 0xC622 : 'ColorMatrix2'
  , 0xC623 : 'CameraCalibration1'
  , 0xC624 : 'CameraCalibration2'
  , 0xC625 : 'ReductionMatrix1'
  , 0xC626 : 'ReductionMatrix2'
  , 0xC627 : 'AnalogBalance'
  , 0xC628 : 'AsShotNeutral'
  , 0xC629 : 'AsShotWhiteXY'
  , 0xC62A : 'BaselineExposure'
  , 0xC62B : 'BaselineNoise'
  , 0xC62C : 'BaselineSharpness'
  , 0xC62D : 'BayerGreenSplit'
  , 0xC62E : 'LinearResponseLimit'
  , 0xC62F : 'CameraSerialNumber'
  , 0xC630 : 'LensInfo'
  , 0xC631 : 'ChromaBlurRadius'
  , 0xC632 : 'AntiAliasStrength'
  , 0xC634 : 'DNGPrivateData'
  , 0xC635 : 'MakerNoteSafety'
  , 0xC65A : 'CalibrationIlluminant1'
  , 0xC65B : 'CalibrationIlluminant2'
  , 0xC65C : 'BestQualityScale'
  , 0xC660 : 'Alias Layer Metadata'
}
