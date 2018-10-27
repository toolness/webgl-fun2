export class Point2D {
  constructor(readonly x: number, readonly y: number) {
  }

  toString(): string {
    return `(${this.x}, ${this.y})`;
  }
}

export class Points2D {
  constructor(private readonly array: Point2D[]) {
  }

  toFloat32Array(): Float32Array {
    const { array } = this;
    const result = new Float32Array(array.length * 2);
    let arrIndex = 0;

    for (let i = 0; i < result.length; i += 2) {
      result[i] = array[arrIndex].x;
      result[i + 1] = array[arrIndex].y;
      arrIndex += 1;
    }

    return result;
  }

  concat(points: Points2D): Points2D {
    const combined = this.array.concat(points.array);
    return new Points2D(combined);
  }

  mirrorHorizontally(): Points2D {
    return new Points2D(this.array.map(point => {
      return new Point2D(-point.x, point.y);
    }));
  }

  toString(): string {
    const points = this.array.map(p => p.toString()).join(' ');
    return `[${points}]`;
  }

  get length(): number {
    return this.array.length;
  }

  static fromArray(array: number[]|Float32Array) {
    const numPoints = array.length / 2;
    const pointArray = new Array<Point2D>(numPoints);
    let arrIndex = 0;
    for (let i = 0; i < numPoints; i++) {
      const x = array[arrIndex];
      const y = array[arrIndex + 1];
      pointArray[i] = new Point2D(x, y);
      arrIndex += 2;
    }
    return new Points2D(pointArray);
  }
}
