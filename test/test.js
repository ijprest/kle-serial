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
    expect(result.keys[0]).to.be.an.instanceOf(kbd.Key);
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

  it("should default width and height to 1", function() {
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
});
