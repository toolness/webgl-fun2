type Column = 1|2|3|4;
type Row = 1|2|3|4;

type Matrix3DTuple = [
  [number, number, number, number],
  [number, number, number, number],
  [number, number, number, number],
  [number, number, number, number]
];

type PerspectiveOptions = {
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

export class Vector3D {
  constructor(readonly x: number, readonly y: number, readonly z: number, readonly w: number = 1.0) {
  }
}

export class Matrix3D {
  constructor(readonly values: Matrix3DTuple = IDENTITY) {
    this.valueAt = this.valueAt.bind(this);
  }

  toFloat32Array(): Float32Array {
    // GLSL expects matrices to be laid out in column-major order, so we must oblige.
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
    z = x instanceof Vector3D ? x.z : z || 0;
    y = x instanceof Vector3D ? x.y : y || 0;
    x = x instanceof Vector3D ? x.x : x;

    return this.multiply(new Matrix3D([
      [1, 0, 0, x],
      [0, 1, 0, y],
      [0, 0, 1, z],
      [0, 0, 0, 1]
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

  rotateZ(radians: number) {
    // Deriving this requires the trigonometric identities for angle sums:
    // https://en.wikipedia.org/wiki/List_of_trigonometric_identities
    return this.multiply(new Matrix3D([
      [Math.cos(radians), -Math.sin(radians), 0, 0],
      [Math.sin(radians),  Math.cos(radians), 0, 0],
      [0                ,  0                , 1, 0],
      [0                ,  0                , 0, 1]
    ]));
  }

  rotateY(radians: number) {
    return this.multiply(new Matrix3D([
      [Math.cos(radians), 0, -Math.sin(radians), 0],
      [0                , 1, 0                 , 0],
      [Math.sin(radians), 0, Math.cos(radians) , 0],
      [0                , 0, 0                 , 1]
    ]));
  }

  rotateX(radians: number) {
    return this.multiply(new Matrix3D([
      [1, 0                 , 0                , 0],
      [0, Math.cos(radians) , Math.sin(radians), 0],
      [0, -Math.sin(radians), Math.cos(radians), 0],
      [0, 0                 , 0                , 1]
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
