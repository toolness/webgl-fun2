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
  readonly color: GlUniformVector;
  readonly transform: GlUniformMatrix3D;
  readonly positionAttributeLocation: number;

  constructor(gl: WebGLRenderingContext) {
    super(gl, simpleVertexShaderSrc, simpleFragmentShaderSrc);
    this.color = new GlUniformVector(this, 'u_color');
    this.transform = new GlUniformMatrix3D(this, 'u_transform');
    this.positionAttributeLocation = getAttribLocation(gl, this.program, 'a_position');
  }
}

class Spaceship {
  orbitTheta = Math.random();
  orbitThetaVelocity = Math.random() * 0.1;
  distanceFromCenter = Math.random();
  scale = Math.random() * 0.5;
  shipTheta = Math.random();
  shipThetaVelocity = Math.random() * 0.1;
  color = [Math.random(), Math.random(), Math.random(), 1.0];

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
  const NUM_SPACESHIPS = 100;

  for (let i = 0; i < NUM_SPACESHIPS; i++) {
    spaceships.push(new Spaceship());
  }

  spaceships.sort((a, b) => a.scale < b.scale ? -1 : 1);

  console.log("Initialization successful!");

  const render = () => {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    program.activate();
    spaceshipRenderer.setupForDrawing();
    spaceships.forEach(spaceship => {
      program.color.set(spaceship.color);
      const baseTransform = new Matrix3D()
        .rotateZ(spaceship.orbitTheta)
        .translate(spaceship.distanceFromCenter, 0)
        .scale(spaceship.scale)
        .rotateZ(spaceship.shipTheta);
      program.transform.set(baseTransform);
      spaceshipRenderer.draw();
      spaceship.update();
    });
    window.requestAnimationFrame(render);
  };

  render();
});
