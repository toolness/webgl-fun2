import { Points3D } from "./points-3d";
import { GlProgram, getAttribLocation, GlUniformMatrix3D } from "./webgl";
import { Points3DRenderer } from "./points-3d-renderer";
import { Matrix3D, Vector3D } from "./matrix-3d";

const simpleVertexShaderSrc = require("./simple-vertex-shader.glsl") as string;
const zBufferFragmentShaderSrc = require("./z-buffer-fragment-shader.glsl") as string;

function makeSpaceship(): Points3D {
  const leftHalf = Points3D.fromArray([
    -0.5, 0, 0,
    0, 0.75, 0,
    0, 0.15, 0
  ]);
  return leftHalf.concat(leftHalf.mirrorHorizontally());
}

function makeGround(y = -1, pointsPerAxis = 20): Points3D {
  const points: number[] = [];
  let xPart = -1;
  let zPart = -1;
  let partInc = 1 / pointsPerAxis;
  for (let i = 0; i <= pointsPerAxis; i++) {
    points.push(xPart, y, zPart);
    points.push(xPart, y, zPart + 2);
    xPart += 2 * partInc;
  }
  xPart = -1;
  for (let i = 0; i <= pointsPerAxis; i++) {
    points.push(xPart, y, zPart);
    points.push(xPart + 2, y, zPart);
    zPart += 2 * partInc;
  }
  return Points3D.fromArray(points);
}

function makeRay(start: Vector3D, ray: Vector3D, segments = 10, length = 5): Points3D {
  let point = start;
  const increment = ray.normalize().times(length / segments);
  const points: number[] = [];

  for (let i = 0; i < segments; i++) {
    points.push(point.x, point.y, point.z);
    point = point.plus(increment);
    points.push(point.x, point.y, point.z);
  }

  return Points3D.fromArray(points);
}

class SimpleGlProgram extends GlProgram {
  readonly transform: GlUniformMatrix3D;
  readonly positionAttributeLocation: number;

  constructor(gl: WebGLRenderingContext) {
    super(gl, simpleVertexShaderSrc, zBufferFragmentShaderSrc);
    this.transform = new GlUniformMatrix3D(this, 'u_transform');
    this.positionAttributeLocation = getAttribLocation(gl, this.program, 'a_position');
  }
}

class Spaceship {
  orbitTheta = Math.random();
  orbitThetaVelocity = Math.random() * 0.01;
  distanceFromCenter = Math.random();
  scale = 0.5;
  shipTheta = Math.random();
  shipThetaVelocity = Math.random() * 0.05;

  constructor(readonly z: number) {
  }

  update() {
    this.orbitTheta += this.orbitThetaVelocity;
    this.shipTheta += this.shipThetaVelocity;
  }
};

/**
 * Convert the given pixel coordinates on the given canvas to
 * WebGL/OpenGL normalized device coordinates (NDC).
 */
function screenCoordsToNDC(canvas: HTMLCanvasElement, x: number, y: number): Vector3D {
  return new Vector3D(
    -1 + (x / canvas.width) * 2,
    // We need to flip the y-axis.
    (-1 + (y / canvas.height) * 2) * -1,
    // The z-coordinate of the near clipping plane is -1 in NDC.
    -1
  );
}

function getCameraPosition(cameraTransform: Matrix3D): Vector3D {
  return cameraTransform.transformVector(new Vector3D(0, 0, 0));
}

/**
 * Calculate the vector representing the ray from the
 * camera to the given screen point.
 */
function getCameraRay(screenPointNDC: Vector3D, cameraPosition: Vector3D, projectionTransform: Matrix3D): Vector3D {
  const inverseProjectionTransform = projectionTransform.inverse();

  // I'm not actually 100% sure if I'm doing the right thing here
  // mathematically, but it makes sense intuitively and seems to work
  // in practice.
  const screenPointInWorld = inverseProjectionTransform.transformVector(screenPointNDC).perspectiveDivide();

  return screenPointInWorld.minus(cameraPosition);
}

/**
 * Convenience class to store a value and detect
 * whether it has changed since the last time
 * we checked.
 */
class CheckableValue<T> {
  private lastCheckedValue: T|null = null;
  private value: T|null = null;

  /** Set the value. */
  set(value: T) {
    this.value = value;
  }

  /**
   * If the value has changed since the last
   * time we checked, pass it to the given callback
   * function. Otherwise, do nothing.
   */
  check(cb: (value: T) => void) {
    if (this.value === this.lastCheckedValue) {
      return;
    }
    this.lastCheckedValue = this.value;
    if (this.value) {
      cb(this.value);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.createElement('canvas');

  document.body.appendChild(canvas);
  canvas.width = 800;
  canvas.height = 800;
  canvas.style.border = '1px solid black';

  const gl = canvas.getContext('webgl');
  if (!gl) throw new Error("webgl is not supported on this browser!");

  const program = new SimpleGlProgram(gl);
  const spaceshipRenderer = new Points3DRenderer(program, makeSpaceship());
  const groundRenderer = new Points3DRenderer(program, makeGround());
  let rayRenderer: Points3DRenderer|null = null;
  const baseProjectionTransform = Matrix3D.perspectiveProjection({
    top: 1,
    bottom: -1,
    right: 1,
    left: -1,
    near: 1,
    far: 3
  });
  const spaceships: Spaceship[] = [];
  const NUM_SPACESHIPS = 30;
  let screenClick = new CheckableValue<{x: number, y: number}>();

  for (let i = 0; i < NUM_SPACESHIPS; i++) {
    spaceships.push(new Spaceship(-1 + ((i / NUM_SPACESHIPS) * 2)));
  }

  canvas.onclick = (e) => { screenClick.set({x: e.offsetX, y: e.offsetY}); };

  console.log("Initialization successful!");

  let cameraRotation = 0;

  const render = () => {
    const cameraTransform = new Matrix3D()
      .rotateY(cameraRotation)
      .translate(0, 0, 2.25);
    const viewTransform = cameraTransform.rigidBodyInverse();
    const projectionTransform = baseProjectionTransform.multiply(viewTransform);

    screenClick.check(coords => {
      const cameraPosition = getCameraPosition(cameraTransform);
      const ray = getCameraRay(
        screenCoordsToNDC(canvas, coords.x, coords.y),
        cameraPosition,
        projectionTransform,
      );
      rayRenderer = new Points3DRenderer(program, makeRay(cameraPosition, ray));
    });

    cameraRotation += 0.001;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    program.activate();
    if (rayRenderer) {
      rayRenderer.setupForDrawing();
      program.transform.set(projectionTransform);
      rayRenderer.draw(gl.LINES);
    }
    groundRenderer.setupForDrawing();
    program.transform.set(projectionTransform);
    groundRenderer.draw(gl.LINES);
    spaceshipRenderer.setupForDrawing();
    spaceships.forEach(spaceship => {
      const baseTransform = new Matrix3D()
        .rotateZ(spaceship.orbitTheta)
        .translate(spaceship.distanceFromCenter, 0, spaceship.z)
        .scale(spaceship.scale)
        .rotateY(spaceship.shipTheta);
      program.transform.set(projectionTransform.multiply(baseTransform));
      spaceshipRenderer.draw();
      spaceship.update();
    });
    window.requestAnimationFrame(render);
  };

  render();
});
