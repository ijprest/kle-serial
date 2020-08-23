import { labelMap } from "./helper";
import { Key, Keyboard, KeyboardMetadata } from "./interfaces";

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
    if (!compareTextSizes(current.textSize, ordered.textSize, ordered.labels)) {
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
