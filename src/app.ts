import { GlProgram, getAttribLocation, GlUniformMatrix3D } from "./webgl";
import { Points3DRenderer, Points3DRendererProgram } from "./points-3d-renderer";
import { Matrix3D, PerspectiveOptions } from "./matrix-3d";
import { Vector3D } from "./vector-3d";
import { InvertibleTransforms3D } from "./invertible-transforms-3d";
import { makeSpaceship, makeGround, makeRayPoints, makeCircle } from "./shapes";
import { Point2D, screenCoordsToWorld, Dimensions2D } from "./screen-space";
import { CheckableValue } from "./checkable-value";
import { Ray3D } from "./ray-3d";
import { getRaySphereIntersection } from "./intersections";
import { getElement } from "./get-element";
import { KeyboardMap } from "./keyboard-map";
import { Points3D } from "./points-3d";

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

type SpaceshipState = {
  orbitTheta: number;
  orbitThetaVelocity: number;
  distanceFromCenter: number;
  scale: number;
  shipTheta: number;
  shipThetaVelocity: number;
  z: number;
};

class Spaceship {
  readonly state: Readonly<SpaceshipState>;
  readonly transform: Readonly<Matrix3D>;
  private readonly colliderScale = 0.5;

  constructor(state: SpaceshipState) {
    this.state = state;

    const transform = new Matrix3D()
      .rotateZ(state.orbitTheta)
      .translate(state.distanceFromCenter, 0, state.z)
      .scale(state.scale)
      .rotateY(state.shipTheta);

    this.transform = transform;
  }

  static createRandom(props: Partial<SpaceshipState>) {
    return new Spaceship({
      orbitTheta: Math.random(),
      orbitThetaVelocity: Math.random() * 0.01,
      distanceFromCenter: Math.random(),
      scale: 0.5,
      shipTheta: Math.random(),
      shipThetaVelocity: Math.random() * 0.05,
      z: Math.random(),
      ...props
    });
  }

  get colliderRadius(): number {
    return this.state.scale * this.colliderScale;
  }

  getColliderTransform(): Matrix3D {
    return this.transform.scale(this.colliderScale);
  }

  center(): Vector3D {
    return this.transform.transformVector(new Vector3D());
  }

  doesRayIntersect(ray: Ray3D): boolean {
    return getRaySphereIntersection(ray, this.center(), this.colliderRadius) !== null;
  }

  update(): Spaceship {
    const { state } = this;
    return new Spaceship({
      ...state,
      orbitTheta: state.orbitTheta + state.orbitThetaVelocity,
      shipTheta: state.shipTheta + state.shipThetaVelocity,
    });
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

function drawCollider(baseTransform: Matrix3D, uniform: GlUniformMatrix3D, renderer: Points3DRenderer) {
  const transforms = [
    baseTransform,
    baseTransform.rotateX(Math.PI / 2),
    baseTransform.rotateY(Math.PI / 2)
  ];

  transforms.forEach(transform => {
    uniform.set(transform);
    renderer.draw(WebGLRenderingContext.LINE_LOOP);
  });
}

class CameraRay {
  readonly ray: Ray3D;
  readonly points: Points3D;
  readonly renderer: Points3DRenderer;

  constructor(options: {
    program: Points3DRendererProgram,
    cameraTransform: InvertibleTransforms3D,
    canvas: Dimensions2D,
    coords: Point2D,
    perspective: PerspectiveOptions,
  }) {
    const cameraPosition = getCameraPosition(options.cameraTransform);
    const screenPointInWorld = screenCoordsToWorld(
      options.canvas,
      options.coords,
      options.perspective,
      options.cameraTransform.matrix
    );
    this.ray = Ray3D.fromTo(cameraPosition, screenPointInWorld);
    this.points = makeRayPoints(this.ray);
    this.renderer = new Points3DRenderer(options.program, this.points);
  }
}

type SceneState = {
  spaceships: Spaceship[];
  cameraRotation: number;
  ray?: CameraRay;
};

class Scene {
  constructor(readonly state: Readonly<SceneState>) {
  }

  update(): Scene {
    const { state } = this;
    return new Scene({
      ...state,
      cameraRotation: state.cameraRotation + 0.001,
      spaceships: state.spaceships.map(ship => ship.update())
    });
  }

  shootRay(ray: CameraRay): Scene {
    const { state } = this;
    return new Scene({
      ...state,
      spaceships: state.spaceships.filter(s => !s.doesRayIntersect(ray.ray)),
      ray
    });
  }

  static createRandom(spaceshipCount: number = 30) {
    const spaceships: Spaceship[] = [];

    for (let i = 0; i < spaceshipCount; i++) {
      spaceships.push(Spaceship.createRandom({
        z: -1 + ((i / spaceshipCount) * 2)
      }));
    }

    return new Scene({
      spaceships,
      cameraRotation: 0,
    });
  }
};

window.addEventListener('DOMContentLoaded', () => {
  const canvas = getElement('canvas', '#canvas');
  const ui = buildUI();
  const gl = canvas.getContext('webgl');

  if (!gl) throw new Error("webgl is not supported on this browser!");

  const program = new SimpleGlProgram(gl);
  const spaceshipRenderer = new Points3DRenderer(program, makeSpaceship());
  const groundRenderer = new Points3DRenderer(program, makeGround());
  const circleRenderer = new Points3DRenderer(program, makeCircle());
  const perspective: PerspectiveOptions = {
    top: 1,
    bottom: -1,
    right: 1,
    left: -1,
    near: 1,
    far: 3
  };
  const baseProjectionTransform = Matrix3D.perspectiveProjection(perspective);
  let scene = Scene.createRandom();
  let screenClick = new CheckableValue<Point2D>();

  canvas.onclick = (e) => {
    if (ui.pause.checked) return;
    screenClick.set({x: e.offsetX, y: e.offsetY});
  };

  console.log("Initialization successful!");

  const render = () => {
    const cameraTransform = new InvertibleTransforms3D()
      .rotateY(scene.state.cameraRotation)
      .translate(0, 0, 2.25);
    const viewTransform = cameraTransform.inverse();
    const projectionTransform = baseProjectionTransform.multiply(viewTransform);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    program.activate();

    if (scene.state.ray) {
      scene.state.ray.renderer.setupForDrawing();
      program.transform.set(projectionTransform);
      scene.state.ray.renderer.draw(gl.LINES);
    }

    groundRenderer.setupForDrawing();
    program.transform.set(projectionTransform);
    groundRenderer.draw(gl.LINES);
    spaceshipRenderer.setupForDrawing();
    scene.state.spaceships.forEach(spaceship => {
      program.transform.set(projectionTransform.multiply(spaceship.transform));
      spaceshipRenderer.draw();
    });

    if (ui.showColliders.checked) {
      circleRenderer.setupForDrawing();
      scene.state.spaceships.forEach(spaceship => {
        const transform = projectionTransform.multiply(spaceship.getColliderTransform());
        drawCollider(transform, program.transform, circleRenderer);
      });
    }

    if (!ui.pause.checked) {
      screenClick.check(coords => {
        scene = scene.shootRay(new CameraRay({
          program, cameraTransform, canvas, coords, perspective
        }));
      });

      scene = scene.update();
    }

    window.requestAnimationFrame(render);
  };

  render();
});
