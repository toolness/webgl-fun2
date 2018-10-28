import { Points3D } from "./points-3d";
import { GlUniformVector, GlProgram, getAttribLocation, GlUniformFloat, GlUniformMatrix3D } from "./webgl";
import { Points3DRenderer } from "./points-3d-renderer";
import { Matrix3D } from "./matrix-3d";

const simpleVertexShaderSrc = require("./simple-vertex-shader.glsl") as string;
const simpleFragmentShaderSrc = require("./simple-fragment-shader.glsl") as string;

function makeSpaceship(): Points3D {
  const leftHalf = Points3D.fromArray([
    -0.5, 0, 0,
    0, 0.75, 0,
    0, 0.15, 0
  ]);
  return leftHalf.concat(leftHalf.mirrorHorizontally());
}

class SimpleGlProgram extends GlProgram {
  readonly transform: GlUniformMatrix3D;
  readonly positionAttributeLocation: number;

  constructor(gl: WebGLRenderingContext) {
    super(gl, simpleVertexShaderSrc, simpleFragmentShaderSrc);
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
  shipThetaVelocity = Math.random() * 0.01;

  constructor(readonly z: number) {
  }

  update() {
    this.orbitTheta += this.orbitThetaVelocity;
    this.shipTheta += this.shipThetaVelocity;
  }
};

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.createElement('canvas');

  document.body.appendChild(canvas);
  canvas.width = 400;
  canvas.height = 400;
  canvas.style.border = '1px solid black';

  const gl = canvas.getContext('webgl');
  if (!gl) throw new Error("webgl is not supported on this browser!");

  const program = new SimpleGlProgram(gl);
  const spaceshipRenderer = new Points3DRenderer(program, makeSpaceship());
  const spaceships: Spaceship[] = [];
  const NUM_SPACESHIPS = 30;

  // This is weird; we're temporarily stuffing the value of z in our homogeneous
  // component w. In our vertex shader, we'll multiply every vertex by (1/w)
  // to complete the perspective transformation.
  //
  // For more details, see:
  //
  // https://en.wikipedia.org/wiki/Transformation_matrix#Perspective_projection
  const perspectiveTransform = new Matrix3D([
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 1, 0]
  ]);

  for (let i = 0; i < NUM_SPACESHIPS; i++) {
    spaceships.push(new Spaceship(0.3 + (i / NUM_SPACESHIPS) * 0.7));
  }

  console.log("Initialization successful!");

  const render = () => {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    program.activate();
    spaceshipRenderer.setupForDrawing();
    spaceships.forEach(spaceship => {
      const baseTransform = new Matrix3D()
        .rotateZ(spaceship.orbitTheta)
        .translate(spaceship.distanceFromCenter, 0, spaceship.z)
        .scale(spaceship.scale)
        .rotateZ(spaceship.shipTheta);
      program.transform.set(perspectiveTransform.multiply(baseTransform));
      spaceshipRenderer.draw();
      spaceship.update();
    });
    window.requestAnimationFrame(render);
  };

  render();
});
