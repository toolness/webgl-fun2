type Column = 1|2|3;
type Row = 1|2|3;

type Matrix2DTuple = [
  [number, number, number],
  [number, number, number],
  [number, number, number]
];

const IDENTITY: Matrix2DTuple = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1]
];

export class Vector2D {
  constructor(readonly x: number, readonly y: number, readonly w: number = 1.0) {
  }
}

export class Matrix2D {
  constructor(readonly values: Matrix2DTuple = IDENTITY) {
    this.valueAt = this.valueAt.bind(this);
  }

  toFloat32Array(): Float32Array {
    return new Float32Array(
      this.values[0].concat(this.values[1]).concat(this.values[2])
    );
  }

  valueAt(row: Row, column: Column): number {
    return this.values[row - 1][column - 1];
  }

  translate(v: Vector2D): Matrix2D;
  translate(x: number, y: number): Matrix2D;

  translate(x: Vector2D|number, y?: number): Matrix2D {
    y = x instanceof Vector2D ? x.y : y || 0;
    x = x instanceof Vector2D ? x.x : x;

    return this.multiply(new Matrix2D([
      [1, 0, x],
      [0, 1, y],
      [0, 0, 1]
    ]));
  }

  rotate(radians: number) {
    // Deriving this requires the trigonometric identities for angle sums:
    // https://en.wikipedia.org/wiki/List_of_trigonometric_identities
    return this.multiply(new Matrix2D([
      [Math.cos(radians), -Math.sin(radians), 0],
      [Math.sin(radians),  Math.cos(radians), 0],
      [0                ,  0                , 1]
    ]));
  }

  multiply(m2: Matrix2D): Matrix2D {
    const col1 = this.transformVector(m2.column(1));
    const col2 = this.transformVector(m2.column(2));
    const col3 = this.transformVector(m2.column(3));
    return new Matrix2D([
      [col1.x, col2.x, col3.x],
      [col1.y, col2.y, col3.y],
      [col1.w, col2.w, col3.w]
    ]);
  }

  transformVector(v: Vector2D): Vector2D {
    const m = this.valueAt;
    return new Vector2D(
      m(1, 1) * v.x + m(1, 2) * v.y + m(1, 3) * v.w,
      m(2, 1) * v.x + m(2, 2) * v.y + m(2, 3) * v.w,
      m(3, 1) * v.x + m(3, 2) * v.y + m(3, 3) * v.w,
    );
  }

  transpose(): Matrix2D {
    const m = this.valueAt;
    return new Matrix2D([
      [m(1, 1), m(2, 1), m(3, 1)],
      [m(1, 2), m(2, 2), m(3, 2)],
      [m(1, 3), m(2, 3), m(3, 3)]
    ]);
  }

  column(col: Column): Vector2D {
    const m = this.valueAt;
    return new Vector2D(
      m(1, col),
      m(2, col),
      m(3, col)
    );
  }
}
