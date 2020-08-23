import * as JSON5 from "json5";
import { deserialize } from "./deserialize";
import { Keyboard } from "./interfaces";
import { serialize } from "./serialize";
export module Serial {
  deserialize;
  serialize;

  export function parse(json: string): Keyboard {
    return deserialize(JSON5.parse(json));
  }
  export function stringify(keyboard: Keyboard): string {
    return JSON.stringify(serialize(keyboard));
  }
}
