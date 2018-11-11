/**
 * A three-dimensional vector. Note that it actually has
 * four elements because we use a homogeneous coordinate
 * system.
 */
export class Vector3D {
  constructor(
    readonly x: number = 0,
    readonly y: number = 0,
    readonly z: number = 0,
    readonly w: number = 1.0
  ) {}

  perspectiveDivide(): Vector3D {
    const { x, y, z, w } = this;
    return new Vector3D(x / w, y / w, z / w);
  }

  minus(v: Vector3D): Vector3D {
    const { x, y, z, w } = this;
    return new Vector3D(x - v.x, y - v.y, z - v.z, w);
  }

  plus(v: Vector3D): Vector3D {
    const { x, y, z, w } = this;
    return new Vector3D(x + v.x, y + v.y, z + v.z, w);
  }

  times(n: number): Vector3D {
    const { x, y, z, w } = this;
    return new Vector3D(x * n, y * n, z * n, w);
  }

  dot(v: Vector3D): number {
    const { x, y, z, w } = this;

    return x * v.x + y * v.y + z * v.z;
  }

  normalize(): Vector3D {
    const { x, y, z, w } = this;
    const len = Math.sqrt(x * x + y * y + z * z);
    return new Vector3D(x / len, y / len, z / len, w);
  }

  /**
   * A helper to convert either a vector or a sequence of coordinates
   * into a vector.
   */
  static fromVectorOrCoords(x: Vector3D | number, y?: number, z?: number): Vector3D {
    z = x instanceof Vector3D ? x.z : z || 0;
    y = x instanceof Vector3D ? x.y : y || 0;
    x = x instanceof Vector3D ? x.x : x;
    return new Vector3D(x, y, z);
  }
}