import { Matrix3D } from "./matrix-3d";
import { Vector3D } from "./vector-3d";

type InvertOp = (m: Matrix3D) => Matrix3D;

/**
 * A class that keeps track of simple 3D transformations made to it, so
 * its inverse can be easily computed.
 * 
 * I originally thought this idea was too silly to use in practice, but
 * it's actually documented in Real-Time Rendering, 4th edition,
 * section 4.1.8 (page 69) as a perfectly valid way to invert many
 * kinds of matrices we're interested in.
 */
export class InvertibleTransforms3D {
  constructor(readonly matrix: Matrix3D = new Matrix3D(), private ops: InvertOp[] = []) {
  }

  private addOp(matrix: Matrix3D, op: InvertOp): InvertibleTransforms3D {
    return new InvertibleTransforms3D(matrix, [op, ...this.ops]);
  }

  translate(v: Vector3D): InvertibleTransforms3D;
  translate(x: number, y: number, z: number): InvertibleTransforms3D;

  translate(x: Vector3D|number, y?: number, z?: number): InvertibleTransforms3D {
    const vector = Vector3D.fromVectorOrCoords(x, y, z);

    return this.addOp(
      this.matrix.translate(vector),
      m => m.translate(vector.times(-1))
    );
  }

  /** Rotate counter-clockwise around the X axis. */
  rotateX(radians: number) {
    return this.addOp(
      this.matrix.rotateX(radians),
      m => m.rotateX(-radians)
    );
  }

  /** Rotate counter-clockwise around the Y axis. */
  rotateY(radians: number) {
    return this.addOp(
      this.matrix.rotateY(radians),
      m => m.rotateY(-radians)
    );
  }

  /** Rotate counter-clockwise around the Z axis. */
  rotateZ(radians: number) {
    return this.addOp(
      this.matrix.rotateZ(radians),
      m => m.rotateZ(-radians)
    );
  }

  /** Return the inverse of the matrix. */
  inverse(): Matrix3D {
    let matrix = new Matrix3D();

    for (let inverseOp of this.ops) {
      matrix = inverseOp(matrix);
    }

    return matrix;
  }
}
