import * as JSON5 from "json5";

export class Key {
  color: string = "#cccccc";
  labels: string[] = [];
  textColor: Array<string | undefined> = [];
  textSize: Array<number | undefined> = [];
  default: { textColor: string; textSize: number } = {
    textColor: "#000000",
    textSize: 3
  };
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

export class KeyboardMetadata {
  author: string = "";
  backcolor: string = "#eeeeee";
  background?: string = "";
  name: string = "";
  notes: string = "";
  radii: string = "";
  switchBrand: string = "";
  switchMount: string = "";
  switchType: string = "";
}

export class Keyboard {
  meta: KeyboardMetadata = new KeyboardMetadata();
  keys: Key[] = [];
}

export class Serial {
  // Helper to copy an object; doesn't handle loops/circular refs, etc.
  static copy(o: any): any {
    if (typeof o !== "object") {
      return o; // primitive value
    } else if (o instanceof Array) {
      var result: any[] = [];
      for (var i = 0; i < o.length; i++) {
        result[i] = Serial.copy(o[i]);
      }
      return result;
    } else {
      var oresult: object = Object.create(Object.getPrototypeOf(o));
      if (o.constructor) oresult.constructor();
      for (var prop in o) {
        if (typeof o[prop] !== "function" || !oresult[prop])
          oresult[prop] = Serial.copy(o[prop]);
      }
      return oresult;
    }
  }

  // Map from serialized label position to normalized position,
  // depending on the alignment flags.
  // prettier-ignore
  private static labelMap: Array<Array<number>> = [
    //0  1  2  3  4  5  6  7  8  9 10 11   // align flags
    [ 0, 6, 2, 8, 9,11, 3, 5, 1, 4, 7,10], // 0 = no centering
    [ 1, 7,-1,-1, 9,11, 4,-1,-1,-1,-1,10], // 1 = center x
    [ 3,-1, 5,-1, 9,11,-1,-1, 4,-1,-1,10], // 2 = center y
    [ 4,-1,-1,-1, 9,11,-1,-1,-1,-1,-1,10], // 3 = center x & y
    [ 0, 6, 2, 8,10,-1, 3, 5, 1, 4, 7,-1], // 4 = center front (default)
    [ 1, 7,-1,-1,10,-1, 4,-1,-1,-1,-1,-1], // 5 = center front & x
    [ 3,-1, 5,-1,10,-1,-1,-1, 4,-1,-1,-1], // 6 = center front & y
    [ 4,-1,-1,-1,10,-1,-1,-1,-1,-1,-1,-1], // 7 = center front & x & y
  ];

  static reorderLabelsIn(labels, align, skipdefault = false) {
    var ret: Array<any> = [];
    for (var i = skipdefault ? 1 : 0; i < labels.length; ++i) {
      ret[Serial.labelMap[align][i]] = labels[i];
    }
    return ret;
  }

  static deserialize(rows: Array<any>): Keyboard {
    if (!(rows instanceof Array)) throw "Error: expected an array of objects";

    // Initialize with defaults
    let current: Key = new Key();
    let kbd = new Keyboard();
    var cluster = { x: 0, y: 0 };
    var align = 4;

    for (var r = 0; r < rows.length; ++r) {
      if (rows[r] instanceof Array) {
        for (var k = 0; k < rows[r].length; ++k) {
          var item = rows[r][k];
          if (typeof item === "string") {
            var newKey: Key = Serial.copy(current);

            // Calculate some generated values
            newKey.width2 =
              newKey.width2 === 0 ? current.width : current.width2;
            newKey.height2 =
              newKey.height2 === 0 ? current.height : current.height2;
            newKey.labels = Serial.reorderLabelsIn(item.split("\n"), align);
            newKey.textSize = Serial.reorderLabelsIn(newKey.textSize, align);

            // Clean up the data
            for (var i = 0; i < 12; ++i) {
              if (!newKey.labels[i]) {
                newKey.textSize[i] = undefined;
                newKey.textColor[i] = undefined;
              }
              if (newKey.textSize[i] == newKey.default.textSize)
                newKey.textSize[i] = undefined;
              if (newKey.textColor[i] == newKey.default.textColor)
                newKey.textColor[i] = undefined;
            }

            // Add the key!
            kbd.keys.push(newKey);

            // Set up for the next key
            current.x += current.width;
            current.width = current.height = 1;
            current.x2 = current.y2 = current.width2 = current.height2 = 0;
            current.nub = current.stepped = current.decal = false;
          }
        }

        // End of the row
        current.y++;
      } else if (typeof rows[r] === "object") {
        if (r != 0) {
          throw "Error: keyboard metadata must the be first element:\n  " +
            JSON5.stringify(rows[r]);
        }
        for (let prop in kbd.meta) {
          if (rows[r][prop]) kbd.meta[prop] = rows[r][prop];
        }
      }
    }

    if (kbd.meta.background === "") delete kbd.meta.backcolor;
    return kbd;
  }

  static parse(json: string): Keyboard {
    return Serial.deserialize(JSON5.parse(json));
  }
}
