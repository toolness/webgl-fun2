type Column = 1|2|3|4;
type Row = 1|2|3|4;

type Matrix3DTuple = [
  [number, number, number, number],
  [number, number, number, number],
  [number, number, number, number],
  [number, number, number, number]
];

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
    return new Float32Array(
      this.values[0]
        .concat(this.values[1])
        .concat(this.values[2])
        .concat(this.values[3])
    );
  }

  valueAt(row: Row, column: Column): number {
    return this.values[row - 1][column - 1];
  }

  translate(v: Vector3D): Matrix3D;
  translate(x: number, y: number): Matrix3D;

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
