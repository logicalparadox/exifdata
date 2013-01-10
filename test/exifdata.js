var join = require('path').join;

var img = join(__dirname, 'bootstrap', 'iphone_4s_pic.jpg');

describe('.extract', function () {
  it('should recognize a jpeg', function (done) {
    exifdata.extract(img, function (err, data) {
      should.not.exist(err);
      data.should.have.property('type', 'JPEG');
      done();
    });
  });

  it('should extract tiff data', function (done) {
    exifdata.extract(img, function (err, data) {
      should.not.exist(err);
      data.should.have.property('tiff')
        .an('object')
        .and.include.keys(
            'Make'
          , 'Model'
          , 'Orientation');
      done();
    });
  });

  it('should extract exif data', function (done) {
    exifdata.extract(img, function (err, data) {
      should.not.exist(err);
      data.should.have.property('exif')
        .an('object')
        .and.include.keys(
            'DateTimeOriginal'
          , 'DateTimeDigitized'
          , 'PixelXDimension'
          , 'PixelYDimension');
      done();
    });
  });

  it('should extract gps data', function (done) {
    exifdata.extract(img, function (err, data) {
      should.not.exist(err);
      data.should.have.property('gps')
        .an('object')
        .and.include.keys(
            'GPSLatitudeRef'
          , 'GPSLatitude'
          , 'GPSLongitudeRef'
          , 'GPSLongitude');
      done();
    });
  });
});
