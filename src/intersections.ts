import { Vector3D } from "./vector-3d";
import { Ray3D } from "./ray-3d";

/**
 * Tests for ray/sphere intersection, returning null if the
 * ray never intersects with the sphere, or the vector
 * representing the closest point of intersection.
 */
export function getRaySphereIntersection(ray: Ray3D, center: Vector3D, radius: number): null | Vector3D {
  const originMinusCenter = ray.origin.minus(center);
  const b = ray.direction.dot(originMinusCenter);
  const c = originMinusCenter.dot(originMinusCenter) - radius * radius;
  const bSquaredMinusC = b * b - c;

  if (bSquaredMinusC < 0) {
    return null;
  }

  const sqrt = Math.sqrt(bSquaredMinusC);
  const t = [-b + sqrt, -b - sqrt].filter(value => value >= 0);
  if (t.length === 0) {
    return null;
  }

  const closestT = t.sort((a, b) => a - b)[0];
  return ray.pointAlong(closestT);
}
