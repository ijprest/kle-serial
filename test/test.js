"use strict";

var expect = require("chai").expect;
var kbd = require("../dist/index");
var Serial = kbd.Serial;

describe("deserialize", function() {
  it("should fail on non-array", function() {
    var result = () => Serial.deserialize("test");
    expect(result).to.throw();
  });

  it("should return empty keyboard on empty array", function() {
    var result = Serial.deserialize([]);
    expect(result).to.be.an.instanceOf(kbd.Keyboard);
    expect(result.keys).to.be.empty;
  });

  it("should parse metadata from first object if it exists", function() {
    var result = Serial.deserialize([{ name: "test" }]);
    expect(result).to.be.an.instanceOf(kbd.Keyboard);
    expect(result.meta.name).to.equal("test");
  });

  it("should throw an exception if metadata is anywhere other than the start", function() {
    var result = () => Serial.deserialize([[], { name: "test" }]);
    expect(result).to.throw();
  });

  it("should default the position to (0,0)", function() {
    var result = Serial.deserialize([["1"]]);
    expect(result).to.be.an.instanceOf(kbd.Keyboard);
    expect(result.keys).to.have.length(1);
    expect(result.keys[0].x).to.equal(0);
    expect(result.keys[0].y).to.equal(0);
  });

  it("should increment x position by the width of the previous key", function() {
    var result = Serial.deserialize([[{ x: 1 }, "1", "2"]]);
    expect(result).to.be.an.instanceOf(kbd.Keyboard);
    expect(result.keys).to.have.length(2);
    expect(result.keys[0].x).to.equal(1);
    expect(result.keys[1].x).to.equal(result.keys[0].x + result.keys[0].width);
    expect(result.keys[1].y).to.equal(result.keys[0].y);
  });

  it("should increment y position whenever a new row starts, and reset x to zero", function() {
    var result = Serial.deserialize([[{ y: 1 }, "1"], ["2"]]);
    expect(result).to.be.an.instanceOf(kbd.Keyboard);
    expect(result.keys).to.have.length(2);
    expect(result.keys[0].y).to.equal(1);
    expect(result.keys[1].x).to.equal(0);
    expect(result.keys[1].y).to.equal(result.keys[0].y + 1);
  });

  it("should add x and y to current position", function() {
    var result = Serial.deserialize([["1", { x: 1 }, "2"]]);
    expect(result).to.be.an.instanceOf(kbd.Keyboard);
    expect(result.keys).to.have.length(2);
    expect(result.keys[0].x).to.equal(0);
    expect(result.keys[1].x).to.equal(2);

    var result = Serial.deserialize([["1"], [{ y: 1 }, "2"]]);
    expect(result).to.be.an.instanceOf(kbd.Keyboard);
    expect(result.keys).to.have.length(2);
    expect(result.keys[0].y).to.equal(0);
    expect(result.keys[1].y).to.equal(2);
  });

  it("should reset width and height to 1", function() {
    var result = Serial.deserialize([[{ w: 5 }, "1", "2"]]);
    expect(result).to.be.an.instanceOf(kbd.Keyboard);
    expect(result.keys).to.have.length(2);
    expect(result.keys[0].width).to.equal(5);
    expect(result.keys[1].width).to.equal(1);

    var result = Serial.deserialize([[{ h: 5 }, "1", "2"]]);
    expect(result).to.be.an.instanceOf(kbd.Keyboard);
    expect(result.keys).to.have.length(2);
    expect(result.keys[0].height).to.equal(5);
    expect(result.keys[1].height).to.equal(1);
  });

  it("should reset stepped, homing, and decal flags to false", function() {
    var result = Serial.deserialize([
      [{ l: true, n: true, d: true }, "1", "2"]
    ]);
    expect(result).to.be.an.instanceOf(kbd.Keyboard);
    expect(result.keys).to.have.length(2);
    expect(result.keys[0].stepped).to.be.true;
    expect(result.keys[0].nub).to.be.true;
    expect(result.keys[0].decal).to.be.true;
    expect(result.keys[1].stepped).to.be.false;
    expect(result.keys[1].nub).to.be.false;
    expect(result.keys[1].decal).to.be.false;
  });

  it("should default width2/height2 if not specified", function() {
    var result = Serial.deserialize([
      [{ w: 2, h: 2 }, "1", { w: 2, h: 2, w2: 4, h2: 4 }, "2"]
    ]);
    expect(result).to.be.an.instanceOf(kbd.Keyboard);
    expect(result.keys).to.have.length(2);
    expect(result.keys[0].width2).to.equal(result.keys[0].width);
    expect(result.keys[0].height2).to.equal(result.keys[0].height);
    expect(result.keys[1].width2).to.not.equal(result.keys[1].width);
    expect(result.keys[1].height2).to.not.equal(result.keys[1].width);
  });

  it("should leave x2,y2 at (0,0) if not specified", function() {
    var result = Serial.deserialize([[{ x: 1, y: 1 }, "1"]]);
    expect(result).to.be.an.instanceOf(kbd.Keyboard);
    expect(result.keys).to.have.length(1);
    expect(result.keys[0].x).to.not.equal(0);
    expect(result.keys[0].y).to.not.equal(0);
    expect(result.keys[0].x2).to.equal(0);
    expect(result.keys[0].y2).to.equal(0);

    var result = Serial.deserialize([[{ x: 1, y: 1, x2: 2, y2: 2 }, "1"]]);
    expect(result).to.be.an.instanceOf(kbd.Keyboard);
    expect(result.keys).to.have.length(1);
    expect(result.keys[0].x).to.not.equal(0);
    expect(result.keys[0].y).to.not.equal(0);
    expect(result.keys[0].x2).to.not.equal(0);
    expect(result.keys[0].y2).to.not.equal(0);
  });

  it("should apply colors to all subsequent keys", function() {
    var result = Serial.deserialize([
      [{ c: "#ff0000", t: "#00ff00" }, "1", "2"]
    ]);
    expect(result).to.be.an.instanceOf(kbd.Keyboard);
    expect(result.keys).to.have.length(2);
    expect(result.keys[0].color).to.equal("#ff0000");
    expect(result.keys[1].color).to.equal("#ff0000");
    expect(result.keys[0].default.textColor).to.equal("#00ff00");
    expect(result.keys[1].default.textColor).to.equal("#00ff00");
  });

  it("should not allow rotation on anything but the first key in a row", function() {
    var r1 = () => Serial.deserialize([[{ r: 45 }, "1", "2"]]);
    expect(r1).to.not.throw();
    var rx1 = () => Serial.deserialize([[{ rx: 45 }, "1", "2"]]);
    expect(rx1).to.not.throw();
    var ry1 = () => Serial.deserialize([[{ ry: 45 }, "1", "2"]]);
    expect(ry1).to.not.throw();

    var r2 = () => Serial.deserialize([["1", { r: 45 }, "2"]]);
    expect(r2).to.throw();
    var rx2 = () => Serial.deserialize([["1", { rx: 45 }, "2"]]);
    expect(rx2).to.throw();
    var ry2 = () => Serial.deserialize([["1", { ry: 45 }, "2"]]);
    expect(ry2).to.throw();
  });

  it("should align legend positions correctly", function() {
    // Some history, to make sense of this:
    // 1. Originally, you could only have top & botton legends, and they were
    //    left-aligned. (top:0 & bottom:1)
    // 2. Next, we added right-aligned labels (top:2 & bottom:3).
    // 3. Next, we added front text (left:4, right:5).
    // 4. Next, we added the alignment flags that allowed you to move the
    //    labels (0-5) to the centered positions (via checkboxes).
    // 5. Nobody understood the checkboxes.  They were removed in favor of
    //    twelve separate label editors, allowing text to be placed anywhere.
    //    This introduced labels 6 through 11.
    // 6. The internal rendering is now Top->Bottom, Left->Right, but to keep
    //    the file-format unchanged, the serialization code now translates
    //    the array from the old layout to the new internal one.

    // prettier-ignore
    var expected = [
      // top row   /**/ middle row /**/ bottom row  /**/   front
      ["0","8","2",/**/"6","9","7",/**/"1","10","3",/**/"4","11","5"], // a=0
      [   ,"0",   ,/**/   ,"6",   ,/**/   , "1",   ,/**/"4","11","5"], // a=1 (center horz)
      [   ,   ,   ,/**/"0","8","2",/**/   ,    ,   ,/**/"4","11","5"], // a=2 (center vert)
      [   ,   ,   ,/**/   ,"0",   ,/**/   ,    ,   ,/**/"4","11","5"], // a=3 (center both)

      ["0","8","2",/**/"6","9","7",/**/"1","10","3",/**/   , "4",   ], // a=4 (center front)
      [   ,"0",   ,/**/   ,"6",   ,/**/   , "1",   ,/**/   , "4",   ], // a=5 (center front+horz)
      [   ,   ,   ,/**/"0","8","2",/**/   ,    ,   ,/**/   , "4",   ], // a=6 (center front+vert)
      [   ,   ,   ,/**/   ,"0",   ,/**/   ,    ,   ,/**/   , "4",   ], // a=7 (center front+both)
    ];

    for (var a = 0; a <= 7; ++a) {
      var name = `a=${a}`;
      var result = Serial.deserialize([
        [{ a: a }, "0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11"]
      ]);
      expect(expected[a], name).to.not.be.undefined;
      expect(result, name).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys, name).to.have.length(1);
      expect(result.keys[0].labels, name).to.have.length(expected[a].length);
      expect(result.keys[0].labels, name).to.have.ordered.members(expected[a]);
    }
  });
});
