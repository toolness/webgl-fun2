import { Vector3D } from "./vector-3d";

type Column = 1|2|3|4;
type Row = 1|2|3|4;

/**
 * A 4x4 matrix represented as
 * a two-dimensional array in
 * row-major order.
 */
type Matrix3DTuple = [
  [number, number, number, number],
  [number, number, number, number],
  [number, number, number, number],
  [number, number, number, number]
];

export type PerspectiveOptions = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  near: number;
  far: number;
};

const IDENTITY: Matrix3DTuple = [
  [1, 0, 0, 0],
  [0, 1, 0, 0],
  [0, 0, 1, 0],
  [0, 0, 0, 1]
];

/**
 * A three-dimensional matrix. Note that it ultimately represents a 4x4
 * matrix because we use homogeneous coordinates.
 */
export class Matrix3D {
  constructor(readonly values: Matrix3DTuple = IDENTITY) {
    this.valueAt = this.valueAt.bind(this);
  }

  /**
   * Convert the matrix into a Float32Array in column-major order
   * (the layout that GLSL expects).
   */
  toFloat32Array(): Float32Array {
    const m = this.valueAt;
    return new Float32Array([
      m(1, 1), m(2, 1), m(3, 1), m(4, 1),
      m(1, 2), m(2, 2), m(3, 2), m(4, 2),
      m(1, 3), m(2, 3), m(3, 3), m(4, 3),
      m(1, 4), m(2, 4), m(3, 4), m(4, 4),
    ]);
  }

  valueAt(row: Row, column: Column): number {
    return this.values[row - 1][column - 1];
  }

  translate(v: Vector3D): Matrix3D;
  translate(x: number, y: number, z: number): Matrix3D;

  translate(x: Vector3D|number, y?: number, z?: number): Matrix3D {
    const v = Vector3D.fromVectorOrCoords(x, y, z);

    return this.multiply(new Matrix3D([
      [1, 0, 0, v.x],
      [0, 1, 0, v.y],
      [0, 0, 1, v.z],
      [0, 0, 0,   1]
    ]));
  }

  scale(v: number) {
    return this.multiply(new Matrix3D([
      [v, 0, 0, 0],
      [0, v, 0, 0],
      [0, 0, v, 0],
      [0, 0, 0, 1]
    ]));
  }

  /** Rotate counter-clockwise around the X axis. */
  rotateX(radians: number) {
    // Deriving this requires the trigonometric identities for angle sums:
    //
    //   https://en.wikipedia.org/wiki/List_of_trigonometric_identities
    //
    // That said, I think an alternative approach is to think of rotation
    // as transformation of basis vectors via matrix multiplication,
    // which simplifies things conceptually.
    const c = Math.cos(radians);
    const s = Math.sin(radians);
    return this.multiply(new Matrix3D([
      [1,  0, 0, 0],
      [0,  c, s, 0],
      [0, -s, c, 0],
      [0,  0, 0, 1]
    ]));
  }

  /** Rotate counter-clockwise around the Y axis. */
  rotateY(radians: number) {
    const c = Math.cos(radians);
    const s = Math.sin(radians);
    return this.multiply(new Matrix3D([
      [c, 0, -s, 0],
      [0, 1,  0, 0],
      [s, 0,  c, 0],
      [0, 0,  0, 1]
    ]));
  }

  /** Rotate counter-clockwise around the Z axis. */
  rotateZ(radians: number) {
    const c = Math.cos(radians);
    const s = Math.sin(radians);
    return this.multiply(new Matrix3D([
      [c, -s, 0, 0],
      [s,  c, 0, 0],
      [0,  0, 1, 0],
      [0,  0, 0, 1]
    ]));
  }

  multiply(m2: Matrix3D): Matrix3D {
    // Conceptualy, it's easiest to think of matrix multiplication
    // as a transformation of a coordinate system's basis
    // vectors:
    //
    //   http://www.3blue1brown.com/essence-of-linear-algebra-page/
    //
    // This isn't particularly efficient code, but hopefully
    // it is readable.
    const col1 = this.transformVector(m2.column(1));
    const col2 = this.transformVector(m2.column(2));
    const col3 = this.transformVector(m2.column(3));
    const col4 = this.transformVector(m2.column(4));
    return new Matrix3D([
      [col1.x, col2.x, col3.x, col4.x],
      [col1.y, col2.y, col3.y, col4.y],
      [col1.z, col2.z, col3.z, col4.z],
      [col1.w, col2.w, col3.w, col4.w],
    ]);
  }

  /**
   * Apply the given function to every element of the matrix, returning
   * a new one.
   */
  map(f: (value: number) => number): Matrix3D {
    return new Matrix3D(this.values.map(row => row.map(f)) as Matrix3DTuple);
  }

  /**
   * Multiply all elements of the matrix by the given constant,
   * returning a new matrix.
   */
  multiplyByConstant(n: number): Matrix3D {
    return this.map(value => value * n);
  }

  /**
   * Create a matrix that transforms eye coordinates into clip
   * coordinates.
   * 
   * Note that clip coordinates will likely have a w-component
   * that is not 1; the GPU will perform a perspective divide
   * after the vertex shader to convert the clip coordinates
   * into normalized device coordinates (NDC).
   * 
   * Note also that the near and far parameters must be
   * specified as positive numbers, as the clip coordinates
   * use a left-handed coordinate system, while the
   * eye coordinates use a right-handed coordinate system,
   * and the projection matrix will convert between the
   * two.
   * 
   * For more details, as well as an excellent derivation
   * of all the math behind all this, see:
   * 
   *   http://www.songho.ca/opengl/gl_projectionmatrix.html#perspective
   */
  static perspectiveProjection(options: PerspectiveOptions): Matrix3D {
    const { near, far, left, right, top, bottom } = options;
    const width = right - left;
    const height = top - bottom;
    const depth = far - near;
    const doubleNear = 2 * near;
    return new Matrix3D([
      [doubleNear / width, 0, (right + left) / width, 0],
      [0, doubleNear / height, (top + bottom) / height, 0],
      [0, 0, -(far + near) / depth, -2 * far * near / depth],
      [0, 0, -1, 0]
    ]);
  }

  transformVector(v: Vector3D): Vector3D {
    const m = this.valueAt;
    return new Vector3D(
      m(1, 1) * v.x + m(1, 2) * v.y + m(1, 3) * v.z + m(1, 4) * v.w,
      m(2, 1) * v.x + m(2, 2) * v.y + m(2, 3) * v.z + m(2, 4) * v.w,
      m(3, 1) * v.x + m(3, 2) * v.y + m(3, 3) * v.z + m(3, 4) * v.w,
      m(4, 1) * v.x + m(4, 2) * v.y + m(4, 3) * v.z + m(4, 4) * v.w,
    );
  }

  column(col: Column): Vector3D {
    const m = this.valueAt;
    return new Vector3D(
      m(1, col),
      m(2, col),
      m(3, col),
      m(4, col)
    );
  }
}
