"use strict";
//import InfluxDB client, this is possible thanks to the layer we created
var PImage = require("pureimage");
import { Stream } from "stream";
import { DateTime } from "luxon";

const { InfluxDB } = require("@influxdata/influxdb-client");

//grab environment variables
const org = process.env.org;
const bucket = process.env.bucket;
let token = process.env.token;
let url = process.env.url;

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
export const image = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("running");

  //create InfluxDB api client with URL and token, then create Write API for the specific org and bucket
  const queryApi = await new InfluxDB({ url, token }).getQueryApi(org);

  const fluxQuery = `\
from(bucket:"${bucket}")\
|> range(start: -2h)\
|> filter(fn: (r) => r._measurement == "weather" and r._field == "temperature")\
`;

  var fontRecord = PImage.registerFont(
    __dirname.concat("/../fonts/Consolas.ttf"),
    "Consolas"
  );
  fontRecord.loadSync();

  let width = 400;
  let height = 200;
  var img = PImage.make(width, height);
  var ctx = img.getContext("2d");
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, img.width, img.height);

  ctx.fillStyle = "black";
  ctx.strokeStyle = "black";
  ctx.font = "20pt 'Consolas'";

  let cX = 100;
  let cY = 10;
  let row = 1;
  let headerText = "Latest weather station readings";
  // let textWidth = ctx.measureText(headerText);
  ctx.fillText(headerText, 20, 30 * row);
  //  ctx.beginPath();
  // ctx.moveTo(20, 40);
  // ctx.lineTo(width - 20, 40);
  // ctx.stroke();
  row++;

  let allReadings: [DateTime, number][] = [];
  for await (const { values, tableMeta } of queryApi.iterateRows(fluxQuery)) {
    const o = tableMeta.toObject(values);
    allReadings.push([DateTime.fromISO(o._time), parseInt(o._value)]);
  }

  if (allReadings.length > 0) {
    allReadings.sort((a, b) => {
      var [dateTime1, _] = a;
      var [dateTime2, _] = b;

      return dateTime2.toMillis() - dateTime1.toMillis();
    });

    var [dateTime, temperatureReading] = allReadings[0];

    dateTime = dateTime.setZone("Europe/London");

    let timeString = dateTime.toLocaleString(DateTime.DATETIME_MED);

    ctx.fillText(timeString, 20, 30 * row);
    row++;

    ctx.fillText(`${temperatureReading}°C`, 20, 30 * row);
    row++;
  }

  const passThroughStream = new Stream.PassThrough();
  const pngData: any = [];
  passThroughStream.on("data", (chunk: any) => pngData.push(chunk));
  passThroughStream.on("end", () => {});
  await PImage.encodePNGToStream(img, passThroughStream);
  let buf = Buffer.concat(pngData);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Cache-Control": "no-cache",
    },
    body: buf.toString("base64"),
    isBase64Encoded: true,
  };
};
