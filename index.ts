import * as JSON5 from 'json5';
import { keys } from 'ts-transformer-keys';

export class Key {
  color: string = "#cccccc";
  labels: string[] = [];
  textColor: string[] = [];
  textSize: number[] = [];
  default: { textColor: string, textSize: number } = { textColor: "#000000", textSize: 3 };
  x: number = 0;
  y: number = 0;
  width: number = 1;
  height: number = 1;
  x2: number = 0;
  y2: number = 0;
  width2: number = 1;
  height2: number = 1;
  rotation_x: number = 0;
  rotation_y: number = 0;
  rotation_angle: number = 0;
  decal: boolean = false;
  ghost: boolean = false;
  stepped: boolean = false;
  nub: false = false;
  profile: string = "";
  sm: string = ""; // switch mount
  sb: string = ""; // switch brand
  st: string = ""; // switch type
}

export interface KeyboardMetadata {
  author?: string;
  backcolor?: string;
  background?: string;
  name?: string;
  notes?: string;
  radii?: string;
  switchBrand?: string;
  switchMount?: string;
  switchType?: string;
}
const KeyboardMetadataProps = keys<KeyboardMetadata>();

export interface Keyboard {
  meta: KeyboardMetadata;
  keys: Key[];
}

export function deserialize(rows: Array<any>): Keyboard | null {
  if (!(rows instanceof Array))
    return null;

  let meta: KeyboardMetadata = {};
  let keys: Key[] = [];

  for (var r = 0; r < rows.length; ++r) {
    if (typeof rows[r] === 'object') {
      if (r != 0) {
        throw "Error: keyboard metadata must the be first element:\n  " + JSON5.stringify(rows[r]);
      }
      for (let prop of KeyboardMetadataProps) {
        if (rows[r][prop]) {
          meta[prop] = rows[r][prop];
        }
      }
    }
  }

  return { meta: meta, keys: keys };
}

export function parse(json: string) {
  //return deserialize(json5.parse(json));
}
