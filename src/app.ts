import { Points2D } from "./points-2d";
import { GlUniformVector, GlProgram, getAttribLocation, GlUniformFloat, GlUniformMatrix2D } from "./webgl";
import { Points2DRenderer } from "./points-2d-renderer";
import { Matrix2D, Vector2D } from "./matrix-2d";

const simpleVertexShaderSrc = require("./simple-vertex-shader.glsl") as string;
const simpleFragmentShaderSrc = require("./simple-fragment-shader.glsl") as string;

function makeSpaceship(): Points2D {
  const leftHalf = Points2D.fromArray([
    -0.5, 0,
    0, 0.75,
    0, 0.15
  ]);
  return leftHalf.concat(leftHalf.mirrorHorizontally());
}

class SimpleGlProgram extends GlProgram {
  readonly color: GlUniformVector;
  readonly transform: GlUniformMatrix2D;
  readonly positionAttributeLocation: number;

  constructor(gl: WebGLRenderingContext) {
    super(gl, simpleVertexShaderSrc, simpleFragmentShaderSrc);
    this.color = new GlUniformVector(this, 'u_color');
    this.transform = new GlUniformMatrix2D(this, 'u_transform');
    this.positionAttributeLocation = getAttribLocation(gl, this.program, 'a_position');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.createElement('canvas');

  document.body.appendChild(canvas);
  canvas.width = 400;
  canvas.height = 400;
  canvas.style.border = '1px solid black';

  const gl = canvas.getContext('webgl');
  if (!gl) throw new Error("webgl is not supported on this browser!");

  const program = new SimpleGlProgram(gl);
  const spaceship = new Points2DRenderer(program, makeSpaceship());
  let orbitTheta = 0;
  let shipTheta = 0;

  console.log("Initialization successful!");

  const render = () => {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    program.activate();
    program.color.set([1, 0, 0.5, 1.0]);
    const baseTransform = new Matrix2D()
      .rotate(orbitTheta)
      .translate(0.6, 0)
      .scale(0.25)
      .rotate(shipTheta);
    program.transform.set(baseTransform);
    spaceship.draw();
    window.requestAnimationFrame(render);
    orbitTheta += 0.01;
    shipTheta += 0.05;
  };

  render();
});
