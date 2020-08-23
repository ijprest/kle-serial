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
  f2: any;
  align: any;
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

  // Convert between our in-memory format & our serialized format
  function serializeProp(props, nname, val, defval) {
    if (val !== defval) {
      props[nname] = val;
    }
    return val;
  }

  function isEmptyObject(o) {
    for (var prop in o) return false;
    return true;
  }

  export function sortKeys(keys) {
    keys.sort(function (a, b) {
      return (
        ((a.rotation_angle + 360) % 360) - ((b.rotation_angle + 360) % 360) ||
        a.rotation_x - b.rotation_x ||
        a.rotation_y - b.rotation_y ||
        a.y - b.y ||
        a.x - b.x
      );
    });
  }

  var disallowedAlignmentForLabels = [
    [1, 2, 3, 5, 6, 7], //0
    [2, 3, 6, 7], //1
    [1, 2, 3, 5, 6, 7], //2
    [1, 3, 5, 7], //3
    [], //4
    [1, 3, 5, 7], //5
    [1, 2, 3, 5, 6, 7], //6
    [2, 3, 6, 7], //7
    [1, 2, 3, 5, 6, 7], //8
    [4, 5, 6, 7], //9
    [], //10
    [4, 5, 6, 7] //11
  ];

  function remove(array: any[], args): any[] {
    var what,
      a = args,
      L = a.length,
      ax;
    while (L && array.length) {
      what = a[--L];
      while ((ax = array.indexOf(what)) !== -1) {
        array.splice(ax, 1);
      }
    }
    return array;
  }
  function reorderLabels(key: Key, current: Key) {
    // Possible alignment flags in order of preference (this is fairly
    // arbitrary, but hoped to reduce raw data size).
    var align = [7, 5, 6, 4, 3, 1, 2, 0];

    // remove impossible flag combinations
    for (var i = 0; i < key.labels.length; ++i) {
      if (key.labels[i]) {
        align.splice;
        align = remove(align, disallowedAlignmentForLabels[i]);
      }
    }

    // For the chosen alignment, generate the label array in the correct order
    var ret: any = {
      align: align[0],
      labels: ["", "", "", "", "", "", "", "", "", "", "", ""],
      textColor: ["", "", "", "", "", "", "", "", "", "", "", ""],
      textSize: []
    };
    for (var i = 0; i < 12; ++i) {
      var ndx = labelMap[ret.align].indexOf(i);
      if (ndx >= 0) {
        if (key.labels[i]) ret.labels[ndx] = key.labels[i];
        if (key.textColor[i]) ret.textColor[ndx] = key.textColor[i];
        if (key.textSize[i]) ret.textSize[ndx] = key.textSize[i];
      }
    }
    // Clean up
    for (var i = 0; i < ret.textSize.length; ++i) {
      if (!ret.labels[i]) ret.textSize[i] = current.textSize[i];
      if (!ret.textSize[i] || ret.textSize[i] == key.default.textSize)
        ret.textSize[i] = 0;
    }
    return ret;
  }

  function compareTextSizes(current, key, labels) {
    if (typeof current === "number") current = [current];
    for (var i = 0; i < 12; ++i) {
      if (
        labels[i] &&
        (!!current[i] !== !!key[i] || (current[i] && current[i] !== key[i]))
      )
        return false;
    }
    return true;
  }

  export function serialize(keyboard: Keyboard) {
    let keys = keyboard.keys;
    let rows: any[] = [];
    let row: any[] = [];
    let current = new Key();
    current.textColor = [current.default.textColor];
    var cluster = { r: 0, rx: 0, ry: 0 };

    // Serialize metadata
    var meta = {};
    for (var metakey in keyboard.meta) {
      serializeProp(
        meta,
        metakey,
        keyboard.meta[metakey],
        new KeyboardMetadata()[metakey]
      );
    }
    if (!isEmptyObject(meta)) {
      rows.push(meta);
    }

    var newRow = true;
    current.y--; // will be incremented on first row

    // Serialize row/key-data
    sortKeys(keys);
    keys.forEach((key) => {
      var props: any = {};
      var ordered = reorderLabels(key, current);

      // start a new row when necessary
      var clusterChanged =
        key.rotation_angle != cluster.r ||
        key.rotation_x != cluster.rx ||
        key.rotation_y != cluster.ry;
      var rowChanged = key.y !== current.y;
      if (row.length > 0 && (rowChanged || clusterChanged)) {
        // Push the old row
        rows.push(row);
        row = [];
        newRow = true;
      }

      if (newRow) {
        // Set up for the new row
        current.y++;

        // 'y' is reset if *either* 'rx' or 'ry' are changed
        if (key.rotation_y != cluster.ry || key.rotation_x != cluster.rx)
          current.y = key.rotation_y;
        current.x = key.rotation_x; // always reset x to rx (which defaults to zero)

        // Update current cluster
        cluster.r = key.rotation_angle;
        cluster.rx = key.rotation_x;
        cluster.ry = key.rotation_y;

        newRow = false;
      }

      current.rotation_angle = serializeProp(
        props,
        "r",
        key.rotation_angle,
        current.rotation_angle
      );
      current.rotation_x = serializeProp(
        props,
        "rx",
        key.rotation_x,
        current.rotation_x
      );
      current.rotation_y = serializeProp(
        props,
        "ry",
        key.rotation_y,
        current.rotation_y
      );
      current.y += serializeProp(props, "y", key.y - current.y, 0);
      current.x += serializeProp(props, "x", key.x - current.x, 0) + key.width;
      current.color = serializeProp(props, "c", key.color, current.color);
      if (!ordered.textColor[0]) {
        ordered.textColor[0] = key.default.textColor;
      } else {
        for (var i = 2; i < 12; ++i) {
          if (
            !ordered.textColor[i] &&
            ordered.textColor[i] !== ordered.textColor[0]
          ) {
            ordered.textColor[i] !== key.default.textColor;
          }
        }
      }
      current.textColor = serializeProp(
        props,
        "t",
        ordered.textColor.join("\n").trimEnd(),
        current.textColor
      );
      current.ghost = serializeProp(props, "g", key.ghost, current.ghost);
      current.profile = serializeProp(props, "p", key.profile, current.profile);
      current.sm = serializeProp(props, "sm", key.sm, current.sm);
      current.sb = serializeProp(props, "sb", key.sb, current.sb);
      current.st = serializeProp(props, "st", key.st, current.st);
      current.align = serializeProp(props, "a", ordered.align, current.align);
      current.default.textSize = serializeProp(
        props,
        "f",
        key.default.textSize,
        current.default.textSize
      );
      if (props.f) current.textSize = [];
      if (
        !compareTextSizes(current.textSize, ordered.textSize, ordered.labels)
      ) {
        if (ordered.textSize.length == 0) {
          serializeProp(props, "f", key.default.textSize, -1); // Force 'f' to be written
        } else {
          var optimizeF2 = !ordered.textSize[0];
          for (var i = 2; i < ordered.textSize.length && optimizeF2; ++i) {
            optimizeF2 = ordered.textSize[i] == ordered.textSize[1];
          }
          if (optimizeF2) {
            var f2 = ordered.textSize[1];
            current.f2 = serializeProp(props, "f2", f2, -1);
            current.textSize = [0, f2, f2, f2, f2, f2, f2, f2, f2, f2, f2, f2];
          } else {
            current.f2 = undefined;
            current.textSize = serializeProp(props, "fa", ordered.textSize, []);
          }
        }
      }
      serializeProp(props, "w", key.width, 1);
      serializeProp(props, "h", key.height, 1);
      serializeProp(props, "w2", key.width2, key.width);
      serializeProp(props, "h2", key.height2, key.height);
      serializeProp(props, "x2", key.x2, 0);
      serializeProp(props, "y2", key.y2, 0);
      serializeProp(props, "n", key.nub || false, false);
      serializeProp(props, "l", key.stepped || false, false);
      serializeProp(props, "d", key.decal || false, false);
      if (!isEmptyObject(props)) {
        row.push(props);
      }
      current.labels = ordered.labels;
      row.push(ordered.labels.join("\n").trimEnd());
    });
    if (row.length > 0) {
      rows.push(row);
    }
    return rows;
  }

  export function parse(json: string): Keyboard {
    return deserialize(JSON5.parse(json));
  }
}
