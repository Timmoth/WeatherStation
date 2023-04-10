import "jest";
import axios from "axios";

describe("image tests", () => {
  it("should return 200", async () => {
    const { status } = await axios({
      url: `http://localhost:3000/image.png`,
    });
    expect(status).toEqual(200);
  });
});
