import { Vector3D } from "./vector-3d";

export class Color extends Vector3D {
  constructor(
    red: number,
    green: number,
    blue: number,
    alpha: number = 1.0  
  ) {
    super(red, green, blue, alpha);
  }

  static fromHex(hex: string): Color {
    hex = hex.toLowerCase();

    if (hex[0] == '#') {
      hex = hex.slice(1);
    }

    const toFloat = (hex: string) => parseInt(hex, 16) / 255;

    const red = toFloat(hex.substr(0, 2));
    const green = toFloat(hex.substr(2, 2));
    const blue = toFloat(hex.substr(4, 2));

    return new Color(red, green, blue);
  }
}

export const BLACK = new Color(0, 0, 0);
