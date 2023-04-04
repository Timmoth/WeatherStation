'use strict';
var gm = require('gm').subClass({ imageMagick: true });
require('gm-base64');

module.exports.image = (event, context, callback) => {

  gm(200, 30, '#fff')
    .drawText(10, 20, "Hello, World!")
    .border(2, 2).borderColor('#ff0000')
    .toBase64('png', function (err, base64) {
      const response_success = {
        statusCode: 200,
        body: JSON.stringify({
          message: 'ok'
        }),
        isBase64Encoded: true
      };
      callback(undefined, response_success)
    });
};