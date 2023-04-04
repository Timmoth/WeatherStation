'use strict';
var PImage = require('pureimage');
var stream = require('stream');

const { InfluxDB } = require('@influxdata/influxdb-client')
//grab environment variables
const org = process.env.org
const bucket = process.env.bucket
const token = process.env.token;
const url = process.env.url

module.exports.image = async (event, context, callback) => {

  //create InfluxDB api client with URL and token, then create Write API for the specific org and bucket
  const queryApi = await new InfluxDB({ url, token }).getQueryApi(org);

  const fluxQuery = `\
from(bucket:"${bucket}")\
|> range(start: -3h)\
|> filter(fn: (r) => r._measurement == "weather" and r._field == "temperature")\
|> last()
`;

  var fontRecord = PImage.registerFont('/var/task/fonts/SourceSansPro-Regular.ttf', 'Source Sans Pro');
  fontRecord.loadSync();

  var img = PImage.make(400, 200);
  var ctx = img.getContext('2d');
  ctx.clearRect(0, 0, img.width, img.height);

  ctx.fillStyle = 'black';
  ctx.font = "20pt 'Source Sans Pro'";

  let i = 1;
  for await (const { values, tableMeta } of queryApi.iterateRows(fluxQuery)) {
    const o = tableMeta.toObject(values)
    ctx.fillText(`${o._value}°C`, 20, 20 * i++);
  }

  const passThroughStream = new stream.PassThrough();
  const pngData = [];
  passThroughStream.on('data', chunk => pngData.push(chunk));
  passThroughStream.on('end', () => { });
  await PImage.encodePNGToStream(img, passThroughStream);
  let buf = Buffer.concat(pngData);

  callback(undefined, {
    statusCode: 200,
    headers: {
      "content-type": "image/png",
    },
    body: buf.toString('base64'),
    isBase64Encoded: true
  })
};