import { Points3D } from "./points-3d";
import { Vector3D } from "./vector-3d";
import { Ray3D } from "./ray-3d";
import { Matrix3D } from "./matrix-3d";

export function makeSpaceship(): Points3D {
  const leftHalf = Points3D.fromArray([
    -0.5, 0, 0,
    0, 0.75, 0,
    0, 0.15, 0
  ]);

  return leftHalf.concat(leftHalf.mirrorHorizontally());
}

export function makeGround(y = -1, xzStart = -1, size = 2, pointsPerAxis = 20): Points3D {
  const points: number[] = [];
  let xPart = xzStart;
  let zPart = xzStart;
  let partInc = 1 / pointsPerAxis;

  for (let i = 0; i <= pointsPerAxis; i++) {
    points.push(xPart, y, zPart);
    points.push(xPart, y, zPart + size);
    xPart += size * partInc;
  }

  xPart = xzStart;
  for (let i = 0; i <= pointsPerAxis; i++) {
    points.push(xPart, y, zPart);
    points.push(xPart + size, y, zPart);
    zPart += size * partInc;
  }

  return Points3D.fromArray(points);
}

export function makeRayPoints(ray: Ray3D, segments = 10, length = 5): Points3D {
  let point = ray.origin;
  const increment = ray.direction.times(length / segments);
  const points: number[] = [];

  for (let i = 0; i < segments; i++) {
    points.push(point.x, point.y, point.z);
    point = point.plus(increment);
    points.push(point.x, point.y, point.z);
  }

  return Points3D.fromArray(points);
}

export function makeCircle(segments = 20): Points3D {
  const points: number[] = [];
  const start = new Vector3D(1, 0, 0);

  for (let i = 0; i < segments; i++) {
    const rotation = new Matrix3D().rotateZ(2 * Math.PI * (i / segments));
    const p = rotation.transformVector(start);
    points.push(p.x, p.y, p.z);
  }

  return Points3D.fromArray(points);
}
