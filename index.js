module.exports = process.env.exifdata_COV
  ? require('./lib-cov/exifdata')
  : require('./lib/exifdata');
