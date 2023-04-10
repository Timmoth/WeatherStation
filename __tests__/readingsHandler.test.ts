import "jest";
import axios from "axios";

describe("readings tests", () => {
  it("should return 200", async () => {
    let body = JSON.stringify({
      nickname: "weather-station",
      uid: "e6614104036d7034",
      timestamp: "2023-04-07T08:40:21Z",
      readings: {
        temperature: 19.54,
        humidity: 55.9,
        pressure: 1016.47,
        luminance: 41.33,
        wind_speed: 0,
        rain: 0,
        rain_per_second: 0.0,
        wind_direction: 90,
        voltage: 0.0,
      },
      model: "weather",
    });
    const { status } = await axios.post(`http://localhost:3000/readings`, body);
    expect(status).toEqual(200);
  });
});
