'use strict';

var expect = require('chai').expect;
var kbd = require('../dist/index');

describe("serialization", function () {

  it('should return null on non-array', function () {
    var result = kbd.deserialize("test");
    expect(result).to.be.null;
  });

  it('should return empty keyboard on empty array', function () {
    var result = kbd.deserialize([]);
    expect(result).to.be.an("object");
    expect(result).to.have.property("keys");
    expect(result.keys).to.be.an("array");
    expect(result.keys).to.be.empty;
  });

  it('should parse metadata from first object if it exists', function () {
    var result = kbd.deserialize([{ name: "test" }]);
    expect(result).to.be.an("object");
    expect(result).to.have.property("meta");
    expect(result.meta).to.have.property("name");
    expect(result.meta.name).to.equal("test");
    console.log(result);
  });

  it('should throw an exception if metadata is anywhere other than the start', function () {
    var result = () => kbd.deserialize([[], { name: "test" }]);
    expect(result).to.throw();
  });
});
