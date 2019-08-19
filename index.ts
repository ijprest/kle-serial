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
  background: { name: string; style: string } | null = null;
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

export module Serial {
  // Helper to copy an object; doesn't handle loops/circular refs, etc.
  function copy(o: any): any {
    if (typeof o !== "object") {
      return o; // primitive value
    } else if (o instanceof Array) {
      var result: any[] = [];
      for (var i = 0; i < o.length; i++) {
        result[i] = copy(o[i]);
      }
      return result;
    } else {
      var oresult: object = Object.create(Object.getPrototypeOf(o));
      oresult.constructor();
      for (var prop in o) {
        oresult[prop] = copy(o[prop]);
      }
      return oresult;
    }
  }

  // Map from serialized label position to normalized position,
  // depending on the alignment flags.
  // prettier-ignore
  let labelMap: Array<Array<number>> = [
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

  function reorderLabelsIn(labels, align) {
    var ret: Array<any> = [];
    for (var i = 0; i < labels.length; ++i) {
      if (labels[i]) ret[labelMap[align][i]] = labels[i];
    }
    return ret;
  }

  function deserializeError(msg, data?) {
    throw "Error: " + msg + (data ? ":\n  " + JSON5.stringify(data) : "");
  }

  export function deserialize(rows: Array<any>): Keyboard {
    if (!(rows instanceof Array))
      deserializeError("expected an array of objects");

    // Initialize with defaults
    let current: Key = new Key();
    let kbd = new Keyboard();
    let cluster = { x: 0, y: 0 };
    var align = 4;

    for (var r = 0; r < rows.length; ++r) {
      if (rows[r] instanceof Array) {
        for (var k = 0; k < rows[r].length; ++k) {
          var item = rows[r][k];
          if (typeof item === "string") {
            var newKey: Key = copy(current);

            // Calculate some generated values
            newKey.width2 =
              newKey.width2 === 0 ? current.width : current.width2;
            newKey.height2 =
              newKey.height2 === 0 ? current.height : current.height2;
            newKey.labels = reorderLabelsIn(item.split("\n"), align);
            newKey.textSize = reorderLabelsIn(newKey.textSize, align);

            // Clean up the data
            for (var i = 0; i < 12; ++i) {
              if (!newKey.labels[i]) {
                delete newKey.textSize[i];
                delete newKey.textColor[i];
              }
              if (newKey.textSize[i] == newKey.default.textSize)
                delete newKey.textSize[i];
              if (newKey.textColor[i] == newKey.default.textColor)
                delete newKey.textColor[i];
            }

            // Add the key!
            kbd.keys.push(newKey);

            // Set up for the next key
            current.x += current.width;
            current.width = current.height = 1;
            current.x2 = current.y2 = current.width2 = current.height2 = 0;
            current.nub = current.stepped = current.decal = false;
          } else {
            if (
              k != 0 &&
              (item.r != null || item.rx != null || item.ry != null)
            ) {
              deserializeError(
                "rotation can only be specified on the first key in a row",
                item
              );
            }
            if (item.r != null) current.rotation_angle = item.r;
            if (item.rx != null) {
              current.rotation_x = cluster.x = item.rx;
              current.x = cluster.x;
              current.y = cluster.y;
            }
            if (item.ry != null) {
              current.rotation_y = cluster.y = item.ry;
              current.x = cluster.x;
              current.y = cluster.y;
            }
            if (item.rx != null) current.rotation_x = item.rx;
            if (item.ry != null) current.rotation_y = item.ry;
            if (item.a != null) align = item.a;
            if (item.f) {
              current.default.textSize = item.f;
              current.textSize = [];
            }
            if (item.f2)
              for (var i = 1; i < 12; ++i) current.textSize[i] = item.f2;
            if (item.fa) current.textSize = item.fa;
            if (item.p) current.profile = item.p;
            if (item.c) current.color = item.c;
            if (item.t) {
              var split = item.t.split("\n");
              if (split[0] != "") current.default.textColor = split[0];
              current.textColor = reorderLabelsIn(split, align);
            }
            if (item.x) current.x += item.x;
            if (item.y) current.y += item.y;
            if (item.w) current.width = current.width2 = item.w;
            if (item.h) current.height = current.height2 = item.h;
            if (item.x2) current.x2 = item.x2;
            if (item.y2) current.y2 = item.y2;
            if (item.w2) current.width2 = item.w2;
            if (item.h2) current.height2 = item.h2;
            if (item.n) current.nub = item.n;
            if (item.l) current.stepped = item.l;
            if (item.d) current.decal = item.d;
            if (item.g != null) current.ghost = item.g;
            if (item.sm) current.sm = item.sm;
            if (item.sb) current.sb = item.sb;
            if (item.st) current.st = item.st;
          }
        }

        // End of the row
        current.y++;
        current.x = current.rotation_x;
      } else if (typeof rows[r] === "object") {
        if (r != 0) {
          deserializeError(
            "keyboard metadata must the be first element",
            rows[r]
          );
        }
        for (let prop in kbd.meta) {
          if (rows[r][prop]) kbd.meta[prop] = rows[r][prop];
        }
      } else {
        deserializeError("unexpected", rows[r]);
      }
    }
    return kbd;
  }

  export function parse(json: string): Keyboard {
    return deserialize(JSON5.parse(json));
  }
}
