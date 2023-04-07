'use strict';
var PImage = require('pureimage');
var stream = require('stream');
const { DateTime } = require("luxon");

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
|> range(start: -2h)\
|> filter(fn: (r) => r._measurement == "weather" and r._field == "temperature")\
`;

  var fontRecord = PImage.registerFont('/var/task/fonts/SourceSansPro-Regular.ttf', 'Source Sans Pro');
  fontRecord.loadSync();

  var img = PImage.make(400, 200);
  var ctx = img.getContext('2d');
  ctx.clearRect(0, 0, img.width, img.height);

  ctx.fillStyle = 'black';
  ctx.font = "25pt 'Source Sans Pro'";

  let cX = 100;
  let cY = 10;

  let allReadings = [];
  for await (const { values, tableMeta } of queryApi.iterateRows(fluxQuery)) {
    const o = tableMeta.toObject(values)
    allReadings.push([DateTime.fromISO(o._time), parseInt(o._value)]);
  }

  if (allReadings.length > 0) {
    allReadings.sort((a, b) => {
      var [dateTime1, _] = a;
      var [dateTime2, _] = b;

      return dateTime2.toMillis() - dateTime1.toMillis()
    })

    var [dateTime, temperatureReading] = allReadings[0]

    dateTime = dateTime.setZone('Europe/London');

    let timeString = dateTime.toLocaleString(DateTime.DATETIME_MED)

    let i = 1;
    ctx.fillText(timeString, 20, 30 * i++);
    ctx.fillText(`${temperatureReading}°C`, 20, 30 * i++);
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
      'Content-Type': 'application/octet-stream',
      "Cache-Control": "no-cache"
    },
    body: buf.toString('base64'),
    isBase64Encoded: true
  })
};