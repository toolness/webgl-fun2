import { GlProgram, getAttribLocation, GlUniformMatrix3D } from "./webgl";
import { Points3DRenderer } from "./points-3d-renderer";
import { Matrix3D, PerspectiveOptions } from "./matrix-3d";
import { Vector3D } from "./vector-3d";
import { InvertibleTransforms3D } from "./invertible-transforms-3d";
import { makeSpaceship, makeGround, makeRayPoints, makeCircle } from "./shapes";
import { Point2D, screenCoordsToWorld } from "./screen-space";
import { CheckableValue } from "./checkable-value";
import { Ray3D } from "./ray-3d";
import { getRaySphereIntersection } from "./intersections";
import { getElement } from "./get-element";
import { KeyboardMap } from "./keyboard-map";

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
  transform: Matrix3D;
  readonly intersectionRadiusScale = 0.5;

  constructor(readonly z: number) {
    this.transform = this.recomputeTransform();
  }

  recomputeTransform(): Matrix3D {
    const transform = new Matrix3D()
      .rotateZ(this.orbitTheta)
      .translate(this.distanceFromCenter, 0, this.z)
      .scale(this.scale)
      .rotateY(this.shipTheta);

    return this.transform = transform;
  }

  get intersectionRadius(): number {
    return this.scale * this.intersectionRadiusScale;
  }

  getIntersectionSphereTransform(): Matrix3D {
    return this.transform.scale(this.intersectionRadiusScale);
  }

  center(): Vector3D {
    return this.transform.transformVector(new Vector3D());
  }

  doesRayIntersect(ray: Ray3D): boolean {
    return getRaySphereIntersection(ray, this.center(), this.intersectionRadius) !== null;
  }

  update() {
    this.orbitTheta += this.orbitThetaVelocity;
    this.shipTheta += this.shipThetaVelocity;
    this.recomputeTransform();
  }
};

function getCameraPosition(cameraTransform: InvertibleTransforms3D): Vector3D {
  return cameraTransform.matrix.transformVector(new Vector3D());
}

function buildUI() {
  const showColliders = getElement('input', '#show-colliders');
  const pause = getElement('input', '#pause');
  const keyMap = new KeyboardMap();

  keyMap.setCheckboxToggler('c', showColliders);
  keyMap.setCheckboxToggler('p', pause);

  return {
    showColliders,
    pause
  };
}

window.addEventListener('DOMContentLoaded', () => {
  const canvas = getElement('canvas', '#canvas');
  const ui = buildUI();
  const gl = canvas.getContext('webgl');

  if (!gl) throw new Error("webgl is not supported on this browser!");

  const program = new SimpleGlProgram(gl);
  const spaceshipRenderer = new Points3DRenderer(program, makeSpaceship());
  const groundRenderer = new Points3DRenderer(program, makeGround());
  const circleRenderer = new Points3DRenderer(program, makeCircle());
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
  let spaceships: Spaceship[] = [];
  const NUM_SPACESHIPS = 30;
  let screenClick = new CheckableValue<Point2D>();

  for (let i = 0; i < NUM_SPACESHIPS; i++) {
    spaceships.push(new Spaceship(-1 + ((i / NUM_SPACESHIPS) * 2)));
  }

  canvas.onclick = (e) => {
    if (ui.pause.checked) return;
    screenClick.set({x: e.offsetX, y: e.offsetY});
  };

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
      const ray = Ray3D.fromTo(cameraPosition, screenPointInWorld);
      spaceships = spaceships.filter(s => !s.doesRayIntersect(ray));
      rayRenderer = new Points3DRenderer(program, makeRayPoints(ray));
    });

    if (!ui.pause.checked) {
      cameraRotation += 0.001;
    }

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
      program.transform.set(projectionTransform.multiply(spaceship.transform));
      spaceshipRenderer.draw();
      if (!ui.pause.checked) {
        spaceship.update();
      }
    });

    if (ui.showColliders.checked) {
      circleRenderer.setupForDrawing();
      spaceships.forEach(spaceship => {
        const transform = projectionTransform.multiply(
          spaceship.getIntersectionSphereTransform()
        );
        program.transform.set(transform);
        circleRenderer.draw(gl.LINE_LOOP);
        program.transform.set(transform.rotateX(Math.PI / 2));
        circleRenderer.draw(gl.LINE_LOOP);
        program.transform.set(transform.rotateY(Math.PI / 2));
        circleRenderer.draw(gl.LINE_LOOP);
      });
    }

    window.requestAnimationFrame(render);
  };

  render();
});
