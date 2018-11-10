import { PerspectiveOptions, Matrix3D } from "./matrix-3d";
import { Vector3D } from "./vector-3d";

export type Point2D = {
  x: number,
  y: number
};

export type Dimensions2D = {
  width: number,
  height: number
};

/**
 * Convert the given screen coordinates, in pixels, to
 * eye coordinates (from the perspective of the camera).
 */
function screenCoordsToEye(canvas: Dimensions2D, point: Point2D, perspective: PerspectiveOptions): Vector3D {
  const width = perspective.right - perspective.left;
  const height = perspective.top - perspective.bottom;
  const xPct = (point.x / canvas.width);
  // Note that we need to flip the y-axis.
  const yPct = ((canvas.height - point.y) / canvas.height);

  const x = perspective.left + xPct * width;
  const y = perspective.bottom + yPct * height;

  // We need to flip the near value because it's specified in
  // clip coordinates.
  const z = -perspective.near;

  return new Vector3D(x, y, z);
}

/**
 * Convert the given pixel coordinates on the given canvas to
 * points in the world.
 */
export function screenCoordsToWorld(
  canvas: Dimensions2D,
  point: Point2D,
  perspective: PerspectiveOptions,
  cameraTransform: Matrix3D
): Vector3D {
  const pointRelativeToCamera = screenCoordsToEye(canvas, point, perspective);
  return cameraTransform.transformVector(pointRelativeToCamera);
}
