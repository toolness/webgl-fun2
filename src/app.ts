import { GlProgram, getAttribLocation, GlUniformMatrix3D } from "./webgl";
import { Points3DRenderer } from "./points-3d-renderer";
import { Matrix3D, PerspectiveOptions } from "./matrix-3d";
import { Vector3D } from "./vector-3d";
import { InvertibleTransforms3D } from "./invertible-transforms-3d";
import { makeSpaceship, makeGround, makeRay } from "./shapes";
import { Point2D, screenCoordsToWorld } from "./screen-space";

const simpleVertexShaderSrc = require("./simple-vertex-shader.glsl") as string;
const zBufferFragmentShaderSrc = require("./z-buffer-fragment-shader.glsl") as string;

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

function getCameraPosition(cameraTransform: InvertibleTransforms3D): Vector3D {
  return cameraTransform.matrix.transformVector(new Vector3D(0, 0, 0));
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
  const perspective: PerspectiveOptions = {
    top: 1,
    bottom: -1,
    right: 1,
    left: -1,
    near: 1,
    far: 3
  };
  const baseProjectionTransform = Matrix3D.perspectiveProjection(perspective);
  const spaceships: Spaceship[] = [];
  const NUM_SPACESHIPS = 30;
  let screenClick = new CheckableValue<Point2D>();

  for (let i = 0; i < NUM_SPACESHIPS; i++) {
    spaceships.push(new Spaceship(-1 + ((i / NUM_SPACESHIPS) * 2)));
  }

  canvas.onclick = (e) => { screenClick.set({x: e.offsetX, y: e.offsetY}); };

  console.log("Initialization successful!");

  let cameraRotation = 0;

  const render = () => {
    const cameraTransform = new InvertibleTransforms3D()
      .rotateY(cameraRotation)
      .translate(0, 0, 2.25);
    const viewTransform = cameraTransform.inverse();
    const projectionTransform = baseProjectionTransform.multiply(viewTransform);

    screenClick.check(coords => {
      const cameraPosition = getCameraPosition(cameraTransform);
      const screenPointInWorld = screenCoordsToWorld(
        canvas,
        coords,
        perspective,
        cameraTransform.matrix
      );
      const ray = screenPointInWorld.minus(cameraPosition);

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
