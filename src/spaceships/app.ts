import { GlProgram, getAttribLocation, GlUniformMatrix3D, GlUniformBoolean, GlUniformVector3D } from "../webgl";
import { Points3DRenderer } from "../points-3d-renderer";
import { Matrix3D, PerspectiveOptions } from "../matrix-3d";
import { Vector3D } from "../vector-3d";
import { InvertibleTransforms3D } from "../invertible-transforms-3d";
import { makeSpaceship, makeGround, makeCircle } from "./shapes";
import { Point2D, screenCoordsToWorld, Dimensions2D } from "../screen-space";
import { Ray3D } from "../ray-3d";
import { getRaySphereIntersection } from "../intersections";
import { BLACK, Color } from "../color";
import { AppUiState } from "./app-ui";

const simpleVertexShaderSrc = require("./simple-vertex-shader.glsl") as string;
const zBufferFragmentShaderSrc = require("./simple-fragment-shader.glsl") as string;

const PURPLE = Color.fromHex('#ed225d');
const BLUE = Color.fromHex('#2d7bb6');

class SimpleGlProgram extends GlProgram {
  readonly projectionTransform: GlUniformMatrix3D;
  readonly viewTransform: GlUniformMatrix3D;
  readonly modelTransform: GlUniformMatrix3D;
  readonly showZBuffer: GlUniformBoolean;
  readonly color: GlUniformVector3D;
  readonly light: GlUniformVector3D;
  readonly normal: GlUniformVector3D;
  readonly shade: GlUniformBoolean;
  readonly positionAttributeLocation: number;

  constructor(gl: WebGLRenderingContext) {
    super(gl, simpleVertexShaderSrc, zBufferFragmentShaderSrc);
    this.projectionTransform = new GlUniformMatrix3D(this, 'u_projection_transform');
    this.viewTransform = new GlUniformMatrix3D(this, 'u_view_transform');
    this.modelTransform = new GlUniformMatrix3D(this, 'u_model_transform');
    this.color = new GlUniformVector3D(this, 'u_color');
    this.light = new GlUniformVector3D(this, 'u_light');
    this.normal = new GlUniformVector3D(this, 'u_normal');
    this.shade = new GlUniformBoolean(this, 'u_shade');
    this.positionAttributeLocation = getAttribLocation(gl, this.program, 'a_position');
    this.showZBuffer = new GlUniformBoolean(this, 'u_show_z_buffer');
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
  color: Color;
};

class Spaceship {
  readonly state: Readonly<SpaceshipState>;

  /** Model matrix to convert from object space to world space. */
  readonly transform: Readonly<Matrix3D>;

  /** The ship's surface normal, in object space. */
  static readonly normal = new Vector3D(0, 0, 1);

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
      color: PURPLE,
      ...props
    });
  }

  get colliderRadius(): number {
    return this.state.scale * this.colliderScale;
  }

  /** Return a model matrix for the collider. */
  getColliderTransform(): Matrix3D {
    return this.transform.scale(this.colliderScale);
  }

  center(): Vector3D {
    return this.transform.transformVector(new Vector3D());
  }

  doesRayIntersect(ray: Ray3D): boolean {
    return getRaySphereIntersection(ray, this.center(), this.colliderRadius) !== null;
  }

  withColor(color: Color): Spaceship {
    return new Spaceship({...this.state, color});
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

function drawCollider(baseModelTransform: Matrix3D,
                      modelTransformUniform: GlUniformMatrix3D,
                      renderer: Points3DRenderer) {
  const modelTransforms = [
    baseModelTransform,
    baseModelTransform.rotateX(Math.PI / 2),
    baseModelTransform.rotateY(Math.PI / 2)
  ];

  modelTransforms.forEach(transform => {
    modelTransformUniform.set(transform);
    renderer.draw(WebGLRenderingContext.LINE_LOOP);
  });
}

class CameraRay {
  readonly ray: Ray3D;

  constructor(options: {
    cameraTransform: InvertibleTransforms3D,
    canvas: Dimensions2D,
    coords: Point2D,
    perspective: PerspectiveOptions,
  }) {
    const cameraPosition = options.cameraTransform.matrix.transformVector(new Vector3D());
    const screenPointInWorld = screenCoordsToWorld(
      options.canvas,
      options.coords,
      options.perspective,
      options.cameraTransform.matrix
    );
    this.ray = Ray3D.fromTo(cameraPosition, screenPointInWorld);
  }
}

type SceneState = {
  perspective: PerspectiveOptions;
  spaceships: Spaceship[];
  cameraRotation: number;
};

class Scene {
  /** Matrix to convert from eye space to clip coordinates. */
  readonly projectionTransform: Matrix3D;

  /** Matrix to move the camera from the origin to its position in world space. */
  readonly cameraTransform: InvertibleTransforms3D;

  /** Matrix to convert from world space to eye space. */
  readonly viewTransform: Matrix3D;

  constructor(readonly state: Readonly<SceneState>) {
    this.projectionTransform = Matrix3D.perspectiveProjection(state.perspective);
    this.cameraTransform = new InvertibleTransforms3D()
      .rotateY(state.cameraRotation)
      .translate(0, 0, 2.25);
    this.viewTransform = this.cameraTransform.inverse();
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
      spaceships: state.spaceships.map(
        s => s.withColor(s.doesRayIntersect(ray.ray) ? BLUE : PURPLE)
      )
    });
  }
};

function createRandomSpaceships(amount = 30) {
  const spaceships: Spaceship[] = [];

  for (let i = 0; i < amount; i++) {
    spaceships.push(Spaceship.createRandom({
      z: -1 + ((i / amount) * 2)
    }));
  }

  return spaceships;
}

type ClickAction = {
  type: 'click';
  point: Point2D;
};

type TickAction = {
  type: 'tick'
};

type UiUpdateAction = {
  type: 'uiupdate',
  ui: AppUiState
};

type AppAction = ClickAction|TickAction|UiUpdateAction;

type AppState = {
  scene: Scene;
  ui: AppUiState;
}

export class App {
  readonly gl: WebGLRenderingContext;
  readonly program: SimpleGlProgram;
  readonly spaceshipRenderer: Points3DRenderer;
  readonly groundRenderer: Points3DRenderer;
  readonly circleRenderer: Points3DRenderer;
  private queuedActions: AppAction[] = [];
  private ui: AppUiState = {
    showColliders: false,
    isPaused: false,
    showZBuffer: false,
    enableLighting: true
  };

  constructor(readonly canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl');

    if (!gl) throw new Error("webgl is not supported on this browser!");

    this.gl = gl;

    const program = new SimpleGlProgram(gl);
    this.program = program;
    this.spaceshipRenderer = new Points3DRenderer(program, makeSpaceship());
    this.groundRenderer = new Points3DRenderer(program, makeGround());
    this.circleRenderer = new Points3DRenderer(program, makeCircle());

    canvas.addEventListener('click', (e) => {
      if (this.ui.isPaused) return;
      const { height, width } = canvas.getBoundingClientRect();
      const x = Math.floor(e.offsetX / width * canvas.width);
      const y = Math.floor(e.offsetY / height * canvas.height);
      this.queuedActions.push({
        type: 'click',
        point: {x, y}
      });
    });
  }

  dispatchAction(action: AppAction) {
    this.queuedActions.push(action);
  }

  getUi() {
    return this.ui;
  }

  render({ scene, ui }: AppState) {
    const { gl, program } = this;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    program.activate();
    program.showZBuffer.set(ui.showZBuffer);
    program.color.set(BLACK);
    // Have the light be where the camera is.
    program.light.set(scene.cameraTransform.matrix.transformVector(new Vector3D()));
    program.projectionTransform.set(scene.projectionTransform);
    program.viewTransform.set(scene.viewTransform);
    program.shade.set(false);

    this.groundRenderer.setupForDrawing();
    // The ground is already in world coordinates.
    program.modelTransform.set(new Matrix3D());
    this.groundRenderer.draw(gl.LINES);

    this.spaceshipRenderer.setupForDrawing();
    program.shade.set(ui.enableLighting);
    program.normal.set(Spaceship.normal);
    scene.state.spaceships.forEach(spaceship => {
      program.color.set(spaceship.state.color);
      program.modelTransform.set(spaceship.transform);
      this.spaceshipRenderer.draw();
    });
    program.shade.set(false);

    if (ui.showColliders) {
      this.circleRenderer.setupForDrawing();
      scene.state.spaceships.forEach(spaceship => {
        const transform = spaceship.getColliderTransform();
        program.color.set(spaceship.state.color);
        drawCollider(transform, program.modelTransform, this.circleRenderer);
      });
    }
  }

  processAction({ scene, ui }: AppState, action: AppAction): AppState {
    switch (action.type) {
      case 'click':
      return { scene: scene.shootRay(new CameraRay({
        coords: action.point,
        canvas: this.canvas,
        cameraTransform: scene.cameraTransform,
        perspective: scene.state.perspective
      })), ui };

      case 'tick':
      return { scene: scene.update(), ui };

      case 'uiupdate':
      return { scene, ui: action.ui };
    }
  }

  createInitialScene(): Scene {
    return new Scene({
      perspective: {
        top: 1,
        bottom: -1,
        right: 1,
        left: -1,
        near: 1,
        far: 4
      },
      spaceships: createRandomSpaceships(),
      cameraRotation: 0
    });
  }

  run() {
    let state: AppState = {
      scene: this.createInitialScene(),
      ui: this.ui
    };

    const updateFrame = () => {
      this.render(state);

      const actions: AppAction[] = [...this.queuedActions];
      this.queuedActions = [];

      if (!state.ui.isPaused) {
        actions.push({ type: 'tick' });
      }

      for (let action of actions) {
        state = this.processAction(state, action);
      }

      window.requestAnimationFrame(updateFrame);
    }

    updateFrame();
  }
}
