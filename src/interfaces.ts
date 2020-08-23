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
