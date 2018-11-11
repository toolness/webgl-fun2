import { Vector3D } from "./vector-3d";

/**
 * An abstraction for a normalized ray that emanates
 * from an origin in a direction.
 */
export class Ray3D {
  readonly direction: Vector3D;

  constructor(readonly origin: Vector3D, direction: Vector3D) {
    this.direction = direction.normalize();
  }

  pointAlong(t: number): Vector3D {
    return this.origin.plus(this.direction.times(t));
  }

  static fromTo(from: Vector3D, to: Vector3D): Ray3D {
    const direction = to.minus(from);
    return new Ray3D(from, direction);
  }
}
