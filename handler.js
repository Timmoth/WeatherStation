'use strict';
//import InfluxDB client, this is possible thanks to the layer we created
const { InfluxDB, Point, } = require('@influxdata/influxdb-client')
//grab environment variables
const org = process.env.org
const bucket = process.env.bucket
const token = process.env.token;
const url = process.env.url

module.exports.reading = async (event, context, callback) => {

  //parse the expected JSON from the body of the POST request
  var body = JSON.parse(event.body)

  //create InfluxDB api client with URL and token, then create Write API for the specific org and bucket
  const writeApi = await new InfluxDB({ url, token }).getWriteApi(org, bucket);

  const dataPoint = new Point('weather')
    .tag('uid', body['uid'])
    .timestamp(body['timestamp'])



  //write data point
  await writeApi.writePoint(dataPoint)

  //close write API
  await writeApi.close().then(() => {
    console.log('WRITE FINISHED')
  })

  //send back response to the client
  const response = {
    statusCode: 200,
    body: JSON.stringify('Write successful'),
  };

  callback(null, response);
};
