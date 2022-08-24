"use strict";

var expect = require("chai").expect;
var kbd = require("../dist/index");

describe("deserialization", function() {
  it("should fail on non-array", function() {
    var result = () => kbd.Serial.deserialize("test");
    expect(result).to.throw();
  });

  it("should fail on non array/object data", function() {
    var result = () => kbd.Serial.deserialize(["test"]);
    expect(result).to.throw();
  });

  it("should return empty keyboard on empty array", function() {
    var result = kbd.Serial.deserialize([]);
    expect(result).to.be.an.instanceOf(kbd.Keyboard);
    expect(result.keys).to.be.empty;
  });

  describe("of metadata", function() {
    it("should parse from first object if it exists", function() {
      var result = kbd.Serial.deserialize([{ name: "test" }]);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.meta.name).to.equal("test");
    });

    it("should throw an exception if found anywhere other than the start", function() {
      var result = () => kbd.Serial.deserialize([[], { name: "test" }]);
      expect(result).to.throw();
    });
  });

  describe("of key positions", function() {
    it("should default to (0,0)", function() {
      var result = kbd.Serial.deserialize([["1"]]);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(1);
      expect(result.keys[0].x).to.equal(0);
      expect(result.keys[0].y).to.equal(0);
    });

    it("should increment x position by the width of the previous key", function() {
      var result = kbd.Serial.deserialize([[{ x: 1 }, "1", "2"]]);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(2);
      expect(result.keys[0].x).to.equal(1);
      expect(result.keys[1].x).to.equal(
        result.keys[0].x + result.keys[0].width
      );
      expect(result.keys[1].y).to.equal(result.keys[0].y);
    });

    it("should increment y position whenever a new row starts, and reset x to zero", function() {
      var result = kbd.Serial.deserialize([[{ y: 1 }, "1"], ["2"]]);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(2);
      expect(result.keys[0].y).to.equal(1);
      expect(result.keys[1].x).to.equal(0);
      expect(result.keys[1].y).to.equal(result.keys[0].y + 1);
    });

    it("should add x and y to current position", function() {
      var result = kbd.Serial.deserialize([["1", { x: 1 }, "2"]]);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(2);
      expect(result.keys[0].x).to.equal(0);
      expect(result.keys[1].x).to.equal(2);

      var result = kbd.Serial.deserialize([["1"], [{ y: 1 }, "2"]]);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(2);
      expect(result.keys[0].y).to.equal(0);
      expect(result.keys[1].y).to.equal(2);
    });

    it("should leave x2,y2 at (0,0) if not specified", function() {
      var result = kbd.Serial.deserialize([[{ x: 1, y: 1 }, "1"]]);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(1);
      expect(result.keys[0].x).to.not.equal(0);
      expect(result.keys[0].y).to.not.equal(0);
      expect(result.keys[0].x2).to.equal(0);
      expect(result.keys[0].y2).to.equal(0);

      var result = kbd.Serial.deserialize([
        [{ x: 1, y: 1, x2: 2, y2: 2 }, "1"]
      ]);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(1);
      expect(result.keys[0].x).to.not.equal(0);
      expect(result.keys[0].y).to.not.equal(0);
      expect(result.keys[0].x2).to.not.equal(0);
      expect(result.keys[0].y2).to.not.equal(0);
    });

    it("should add x and y to center of rotation", function() {
      var result = kbd.Serial.deserialize([[{r:10,rx:1,ry:1,y:-1.1,x:2},"E"]]);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(1);
      expect(result.keys[0].x).to.equal(3);
      expect(result.keys[0].y).to.be.closeTo(-0.1, 0.0001);
    });
  });

  describe("of key sizes", function() {
    it("should reset width and height to 1", function() {
      var result = kbd.Serial.deserialize([[{ w: 5 }, "1", "2"]]);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(2);
      expect(result.keys[0].width).to.equal(5);
      expect(result.keys[1].width).to.equal(1);

      var result = kbd.Serial.deserialize([[{ h: 5 }, "1", "2"]]);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(2);
      expect(result.keys[0].height).to.equal(5);
      expect(result.keys[1].height).to.equal(1);
    });

    it("should default width2/height2 if not specified", function() {
      var result = kbd.Serial.deserialize([
        [{ w: 2, h: 2 }, "1", { w: 2, h: 2, w2: 4, h2: 4 }, "2"]
      ]);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(2);
      expect(result.keys[0].width2).to.equal(result.keys[0].width);
      expect(result.keys[0].height2).to.equal(result.keys[0].height);
      expect(result.keys[1].width2).to.not.equal(result.keys[1].width);
      expect(result.keys[1].height2).to.not.equal(result.keys[1].width);
    });
  });

  describe("of other properties", function() {
    it("should reset stepped, homing, and decal flags to false", function() {
      var result = kbd.Serial.deserialize([
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

    it("should propagate the ghost flag", function() {
      var result = kbd.Serial.deserialize([["0", { g: true }, "1", "2"]]);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(3);
      expect(result.keys[0].ghost).to.be.false;
      expect(result.keys[1].ghost).to.be.true;
      expect(result.keys[2].ghost).to.be.true;
    });

    it("should propagate the profile flag", function() {
      var result = kbd.Serial.deserialize([["0", { p: "DSA" }, "1", "2"]]);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(3);
      expect(result.keys[0].profile).to.be.empty;
      expect(result.keys[1].profile).to.equal("DSA");
      expect(result.keys[2].profile).to.equal("DSA");
    });

    it("should propagate switch properties", function() {
      var result = kbd.Serial.deserialize([["1", { sm: "cherry" }, "2", "3"]]);
      expect(result, "sm").to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys, "sm").to.have.length(3);
      expect(result.keys[0].sm, "sm_0").to.equal("");
      expect(result.keys[1].sm, "sm_1").to.equal("cherry");
      expect(result.keys[2].sm, "sm_2").to.equal("cherry");

      var result = kbd.Serial.deserialize([["1", { sb: "cherry" }, "2", "3"]]);
      expect(result, "sb").to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys, "sb").to.have.length(3);
      expect(result.keys[0].sb, "sb_0").to.equal("");
      expect(result.keys[1].sb, "sb_1").to.equal("cherry");
      expect(result.keys[2].sb, "sb_2").to.equal("cherry");

      var result = kbd.Serial.deserialize([
        ["1", { st: "MX1A-11Nx" }, "2", "3"]
      ]);
      expect(result, "st").to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys, "st").to.have.length(3);
      expect(result.keys[0].st, "st_0").to.equal("");
      expect(result.keys[1].st, "st_1").to.equal("MX1A-11Nx");
      expect(result.keys[2].st, "st_2").to.equal("MX1A-11Nx");
    });
  });

  describe("of text color", function() {
    it("should apply colors to all subsequent keys", function() {
      var result = kbd.Serial.deserialize([
        [{ c: "#ff0000", t: "#00ff00" }, "1", "2"]
      ]);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(2);
      expect(result.keys[0].color).to.equal("#ff0000");
      expect(result.keys[1].color).to.equal("#ff0000");
      expect(result.keys[0].default.textColor).to.equal("#00ff00");
      expect(result.keys[1].default.textColor).to.equal("#00ff00");
    });

    it("should apply `t` to all legends", function() {
      var result = kbd.Serial.deserialize([
        [{ a: 0, t: "#444444" }, "0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11"]
      ]);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(1);
      expect(result.keys[0].default.textColor).to.equal("#444444");
      for (var i = 0; i < 12; ++i) {
        expect(result.keys[0].textColor[i], `[${i}]`).to.be.undefined;
      }
    });

    it("should handle generic case", function() {
      var labels =
        "#111111\n#222222\n#333333\n#444444\n" +
        "#555555\n#666666\n#777777\n#888888\n" +
        "#999999\n#aaaaaa\n#bbbbbb\n#cccccc";
      var result = kbd.Serial.deserialize([
        [{ a: 0, t: /*colors*/ labels }, /*labels*/ labels]
      ]);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(1);
      expect(result.keys[0].default.textColor).to.equal("#111111");
      for (var i = 0; i < 12; ++i) {
        expect(
          result.keys[0].textColor[i] || result.keys[0].default.textColor,
          `i=${i}`
        ).to.equal(result.keys[0].labels[i]);
      }
    });

    it("should handle blanks", function() {
      var labels =
        "#111111\nXX\n#333333\n#444444\n" +
        "XX\n#666666\nXX\n#888888\n" +
        "#999999\n#aaaaaa\n#bbbbbb\n#cccccc";
      var result = kbd.Serial.deserialize([
        [{ a: 0, t: /*colors*/ labels.replace(/XX/g, "") }, /*labels*/ labels]
      ]);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(1);
      expect(result.keys[0].default.textColor).to.equal("#111111");
      for (var i = 0; i < 12; ++i) {
        // if blank, should be same as color[0] / default
        var color =
          result.keys[0].textColor[i] || result.keys[0].default.textColor;
        if (result.keys[0].labels[i] === "XX")
          expect(color, `i=${i}`).to.equal("#111111");
        else expect(color, `i=${i}`).to.equal(result.keys[0].labels[i]);
      }
    });

    it("should not reset default color if blank", function() {
      var result = kbd.Serial.deserialize([
        [{ t: "#ff0000" }, "1", { t: "\n#00ff00" }, "2"]
      ]);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(2);
      expect(result.keys[0].default.textColor, "[0]").to.equal("#ff0000");
      expect(result.keys[1].default.textColor, "[1]").to.equal("#ff0000");
    });

    it("should delete values equal to the default", function() {
      var result = kbd.Serial.deserialize([
        [
          { t: "#ff0000" },
          "1",
          { t: "\n#ff0000" },
          "\n2",
          { t: "\n#00ff00" },
          "\n3"
        ]
      ]);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(3);
      expect(result.keys[1].labels[6]).to.equal("2");
      expect(result.keys[1].textColor[6]).to.be.undefined;
      expect(result.keys[2].labels[6]).to.equal("3");
      expect(result.keys[2].textColor[6]).to.equal("#00ff00");
    });
  });

  describe("of rotation", function() {
    it("should not be allowed on anything but the first key in a row", function() {
      var r1 = () => kbd.Serial.deserialize([[{ r: 45 }, "1", "2"]]);
      expect(r1).to.not.throw();
      var rx1 = () => kbd.Serial.deserialize([[{ rx: 45 }, "1", "2"]]);
      expect(rx1).to.not.throw();
      var ry1 = () => kbd.Serial.deserialize([[{ ry: 45 }, "1", "2"]]);
      expect(ry1).to.not.throw();

      var r2 = () => kbd.Serial.deserialize([["1", { r: 45 }, "2"]]);
      expect(r2).to.throw();
      var rx2 = () => kbd.Serial.deserialize([["1", { rx: 45 }, "2"]]);
      expect(rx2).to.throw();
      var ry2 = () => kbd.Serial.deserialize([["1", { ry: 45 }, "2"]]);
      expect(ry2).to.throw();
    });
  });

  describe("of legends", function() {
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
        var result = kbd.Serial.deserialize([
          [{ a: a }, "0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11"]
        ]);
        expect(expected[a], name).to.not.be.undefined;
        expect(result, name).to.be.an.instanceOf(kbd.Keyboard);
        expect(result.keys, name).to.have.length(1);
        expect(result.keys[0].labels, name).to.have.length(expected[a].length);
        expect(result.keys[0].labels, name).to.have.ordered.members(
          expected[a]
        );
      }
    });
  });

  describe("of font sizes", function() {
    it("should handle `f` at all alignments", function() {
      for (var a = 0; a < 7; ++a) {
        var name = `a=${a}`;
        var result = kbd.Serial.deserialize([
          [{ f: 1, a: a }, "0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11"]
        ]);
        expect(result, name).to.be.an.instanceOf(kbd.Keyboard);
        expect(result.keys, name).to.have.length(1);
        expect(result.keys[0].default.textSize, name).to.equal(1);
        expect(result.keys[0].textSize, name).to.have.length(0);
      }
    });

    it("should handle `f2` at all alignments", function() {
      for (var a = 0; a < 7; ++a) {
        var name = `a=${a}`;
        var result = kbd.Serial.deserialize([
          [{ f: 1, f2: 2, a: a }, "0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11"]
        ]);
        expect(result, name).to.be.an.instanceOf(kbd.Keyboard);
        expect(result.keys, name).to.have.length(1);
        // All labels should be 2, except the first one ('0')
        for (var i = 0; i < 12; ++i) {
          var name_i = `${name} [${i}]`;
          if (result.keys[0].labels[i]) {
            var expected = result.keys[0].labels[i] === "0" ? 1 : 2;
            if (result.keys[0].labels[i] === "0") {
              expect(result.keys[0].textSize[i], name_i).to.be.undefined;
            } else {
              expect(result.keys[0].textSize[i], name_i).to.equal(2);
            }
          } else {
            // no text at [i]; textSize should be undefined
            expect(result.keys[0].textSize[i], name_i).to.be.undefined;
          }
        }
      }
    });

    it("should handle `fa` at all alignments", function() {
      for (var a = 0; a < 7; ++a) {
        var name = `a=${a}`;
        var result = kbd.Serial.deserialize([
          [
            { f: 1, fa: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], a: a },
            "2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12\n13"
          ]
        ]);
        expect(result, name).to.be.an.instanceOf(kbd.Keyboard);
        expect(result.keys, name).to.have.length(1);

        for (var i = 0; i < 12; ++i) {
          var name_i = `${name} [${i}]`;
          if (result.keys[0].labels[i]) {
            expect(result.keys[0].textSize[i], name_i).to.equal(
              parseInt(result.keys[0].labels[i])
            );
          }
        }
      }
    });

    it("should handle blanks in `fa`", function() {
      for (var a = 0; a < 7; ++a) {
        var name = `a=${a}`;
        var result = kbd.Serial.deserialize([
          [
            { f: 1, fa: [, 2, , 4, , 6, , 8, 9, 10, , 12], a: a },
            "x\n2\nx\n4\nx\n6\nx\n8\n9\n10\nx\n12"
          ]
        ]);
        expect(result, name).to.be.an.instanceOf(kbd.Keyboard);
        expect(result.keys, name).to.have.length(1);

        for (var i = 0; i < 12; ++i) {
          var name_i = `${name} [${i}]`;
          if (result.keys[0].labels[i] === "x") {
            expect(result.keys[0].textSize[i], name_i).to.be.undefined;
          }
        }
      }
    });

    it("should not reset default size if blank", function() {
      var result = kbd.Serial.deserialize([
        [{ f: 1 }, "1", { fa: [, 2] }, "2"]
      ]);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(2);
      expect(result.keys[0].default.textSize, "[0]").to.equal(1);
      expect(result.keys[1].default.textSize, "[1]").to.equal(1);
    });

    it("should delete values equal to the default", function() {
      var result = kbd.Serial.deserialize([
        [{ f: 1 }, "1", { fa: "\n1" }, "\n2", { fa: "\n2" }, "\n3"]
      ]);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(3);
      expect(result.keys[1].labels[6]).to.equal("2");
      expect(result.keys[1].textSize[6]).to.be.undefined;
      expect(result.keys[2].labels[6]).to.equal("3");
      expect(result.keys[2].textSize[6]).to.equal("2");
    });
  });

  describe("of strings", function() {
    it("should be lenient about quotes", function() {
      var result1 = () =>
        kbd.Serial.parse(`[
        { name: "Sample", author: "Your Name" },
        ["Q", "W", "E", "R", "T", "Y"]
      ]`);

      var result2 = () =>
        kbd.Serial.parse(`[
        { "name": "Sample", "author": "Your Name" },
        ["Q", "W", "E", "R", "T", "Y"]
      ]`);

      var result3 = () =>
        kbd.Serial.deserialize([
          { name: "Sample", author: "Your Name" },
          ["Q", "W", "E", "R", "T", "Y"]
        ]);

      expect(result1).to.not.throw();
      expect(result2).to.not.throw();
      expect(result1(), "1<>2").to.deep.equal(result2());
      expect(result1(), "1<>3").to.deep.equal(result3());
    });
  });
});
