import { Points2D } from "./points-2d";
import { GlUniformVector, GlProgram, getAttribLocation, GlUniformFloat } from "./webgl";
import { Points2DRenderer } from "./points-2d-renderer";

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
  readonly translate: GlUniformVector;
  readonly rotate: GlUniformFloat;
  readonly positionAttributeLocation: number;

  constructor(gl: WebGLRenderingContext) {
    super(gl, simpleVertexShaderSrc, simpleFragmentShaderSrc);
    this.color = new GlUniformVector(this, 'u_color');
    this.translate = new GlUniformVector(this, 'u_translate');
    this.rotate = new GlUniformFloat(this, 'u_rotate');
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

  console.log("Initialization successful!");

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  program.activate();
  program.color.set([1, 0, 0.5, 1.0])
  program.translate.set([0, 0, 0, 0]);
  program.rotate.set(Math.PI / 4);
  spaceship.draw();
});
