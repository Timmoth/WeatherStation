"use strict";
//import InfluxDB client, this is possible thanks to the layer we created
const { InfluxDB, Point } = require("@influxdata/influxdb-client");
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

//grab environment variables
const org = process.env.org;
const bucket = process.env.bucket;
const token = process.env.token;
const url = process.env.url;

export const readings = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  //parse the expected JSON from the body of the POST request
  var body = JSON.parse(event.body);

  //create InfluxDB api client with URL and token, then create Write API for the specific org and bucket
  const writeApi = await new InfluxDB({ url, token }).getWriteApi(org, bucket);
  var date = new Date(body["timestamp"]);
  const dataPoint = new Point("weather")
    .tag("uid", body["uid"])
    .timestamp(date)
    .floatField("temperature", body["readings"]["temperature"])
    .floatField("humidity", body["readings"]["humidity"])
    .floatField("pressure", body["readings"]["pressure"])
    .floatField("luminance", body["readings"]["luminance"])
    .floatField("rain", body["readings"]["rain"])
    .floatField("rain_per_second", body["readings"]["rain_per_second"])
    .floatField("wind_direction", body["readings"]["wind_direction"])
    .floatField("wind_speed", body["readings"]["wind_speed"])
    .floatField("voltage", body["readings"]["voltage"]);

  //write data point
  await writeApi.writePoint(dataPoint);

  //close write API
  await writeApi.close().then(() => {
    console.log("WRITE FINISHED");
  });

  return {
    statusCode: 200,
    body: "Reading accepted.",
  };
};
