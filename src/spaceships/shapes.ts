import { Points3D } from "../points-3d";
import { Vector3D } from "../vector-3d";
import { Matrix3D } from "../matrix-3d";

export function makeSpaceship(): Points3D {
  const translate = new Matrix3D().translate(0, -0.25, 0);
  const mirror = new Matrix3D().scale(-1, 1, 1);
  const leftHalf = translate.transformPoints(Points3D.fromArray([
    -0.5, 0, 0,
    0, 0.75, 0,
    0, 0.15, 0
  ]));

  return leftHalf.concat(mirror.transformPoints(leftHalf));
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
