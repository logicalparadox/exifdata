var join = require('path').join;

var img = join(__dirname, 'bootstrap', 'iphone_4s_pic.jpg');

describe('.extract', function () {
  it('should recognize a jpeg', function (done) {
    exifdata.extract(img, function (err, data) {
      should.not.exist(err);

      data.should.have.property('type', 'JPEG');
      console.log(data);

      done();
    });
  });
});
