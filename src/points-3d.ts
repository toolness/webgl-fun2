import { Vector3D } from "./vector-3d";

export class Points3D {
  constructor(private readonly array: Vector3D[]) {
  }

  toFloat32Array(): Float32Array {
    const { array } = this;
    const result = new Float32Array(array.length * 3);
    let arrIndex = 0;

    for (let i = 0; i < result.length; i += 3) {
      result[i] = array[arrIndex].x;
      result[i + 1] = array[arrIndex].y;
      result[i + 2] = array[arrIndex].z;
      arrIndex += 1;
    }

    return result;
  }

  concat(points: Points3D): Points3D {
    const combined = this.array.concat(points.array);
    return new Points3D(combined);
  }

  map(fn: (v: Vector3D) => Vector3D) {
    return new Points3D(this.array.map(fn));
  }

  get length(): number {
    return this.array.length;
  }

  static fromArray(array: number[]|Float32Array) {
    const numPoints = array.length / 3;
    const pointArray = new Array<Vector3D>(numPoints);
    let arrIndex = 0;
    for (let i = 0; i < numPoints; i++) {
      const x = array[arrIndex];
      const y = array[arrIndex + 1];
      const z = array[arrIndex + 2];
      pointArray[i] = new Vector3D(x, y, z);
      arrIndex += 3;
    }
    return new Points3D(pointArray);
  }
}
