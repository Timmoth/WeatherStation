"use strict";
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.image = void 0;
//import InfluxDB client, this is possible thanks to the layer we created
var PImage = require("pureimage");
const stream_1 = require("stream");
const luxon_1 = require("luxon");
const { InfluxDB } = require("@influxdata/influxdb-client");
//grab environment variables
const org = process.env.org;
const bucket = process.env.bucket;
const token = process.env.token;
const url = process.env.url;
const image = async (event) => {
    var _a, e_1, _b, _c;
    //create InfluxDB api client with URL and token, then create Write API for the specific org and bucket
    const queryApi = await new InfluxDB({ url, token }).getQueryApi(org);
    const fluxQuery = `\
from(bucket:"${bucket}")\
|> range(start: -2h)\
|> filter(fn: (r) => r._measurement == "weather" and r._field == "temperature")\
`;
    var fontRecord = PImage.registerFont("./fonts/Consolas.ttf", "Consolas");
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
    let allReadings = [];
    try {
        for (var _d = true, _e = __asyncValues(queryApi.iterateRows(fluxQuery)), _f; _f = await _e.next(), _a = _f.done, !_a;) {
            _c = _f.value;
            _d = false;
            try {
                const { values, tableMeta } = _c;
                const o = tableMeta.toObject(values);
                allReadings.push([luxon_1.DateTime.fromISO(o._time), parseInt(o._value)]);
            }
            finally {
                _d = true;
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (!_d && !_a && (_b = _e.return)) await _b.call(_e);
        }
        finally { if (e_1) throw e_1.error; }
    }
    if (allReadings.length > 0) {
        allReadings.sort((a, b) => {
            var [dateTime1, _] = a;
            var [dateTime2, _] = b;
            return dateTime2.toMillis() - dateTime1.toMillis();
        });
        var [dateTime, temperatureReading] = allReadings[0];
        dateTime = dateTime.setZone("Europe/London");
        let timeString = dateTime.toLocaleString(luxon_1.DateTime.DATETIME_MED);
        ctx.fillText(timeString, 20, 30 * row);
        row++;
        ctx.fillText(`${temperatureReading}°C`, 20, 30 * row);
        row++;
    }
    const passThroughStream = new stream_1.Stream.PassThrough();
    const pngData = [];
    passThroughStream.on("data", (chunk) => pngData.push(chunk));
    passThroughStream.on("end", () => { });
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
exports.image = image;
//# sourceMappingURL=imageHandler.js.map