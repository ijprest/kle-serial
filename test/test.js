"use strict";

var expect = require("chai").expect;
var kbd = require("../dist/index");
var Serial = kbd.Serial;

describe("serialization", function() {
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

  it("should default to (0,0)", function() {
    var result = Serial.deserialize([["1"]]);
    expect(result).to.be.an.instanceOf(kbd.Keyboard);
    expect(result.keys).to.have.length(1);
    expect(result.keys[0]).to.be.an.instanceOf(kbd.Key);
    expect(result.keys[0].x).to.equal(0);
    expect(result.keys[0].y).to.equal(0);
  });
});
