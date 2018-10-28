import { Points2D } from "./points-2d";
import { GlUniformVector, GlProgram, getAttribLocation, GlUniformFloat, GlUniformMatrix2D } from "./webgl";
import { Points2DRenderer } from "./points-2d-renderer";
import { Matrix2D, Vector2D } from "./matrix-2d";

const simpleVertexShaderSrc = require("./simple-vertex-shader.glsl") as string;
const simpleFragmentShaderSrc = require("./simple-fragment-shader.glsl") as string;

function equilateralHeight(length: number): number {
  return Math.sqrt(0.75 * Math.pow(length, 2));
}

function makeEquilateral(x: number, y: number, length: number) {
  const halfLength = length / 2;
  const halfHeight = equilateralHeight(length) / 2;
  return Points2D.fromArray([
    x - halfLength, y - halfHeight,
    x, y + halfHeight,
    x + halfLength, y - halfHeight
  ]);
}

function makeSierpinksi(n: number, x: number = 0, y: number = 0, length: number = 2): Points2D {
  if (n === 0) {
    return makeEquilateral(x, y, length);
  }
  const smallerLength = length / 2;
  const smallerHeight = equilateralHeight(smallerLength);
  const halfSmallerHeight = smallerHeight / 2;
  const halfSmallerLength = smallerLength / 2;
  const top = makeSierpinksi(n - 1, x, y + halfSmallerHeight, smallerLength);
  const left = makeSierpinksi(n - 1, x - halfSmallerLength, y - halfSmallerHeight, smallerLength);
  const right = makeSierpinksi(n - 1, x + halfSmallerLength, y - halfSmallerHeight, smallerLength);
  return top.concat(left).concat(right);
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
  const sierpinski = makeSierpinksi(6);
  const sierpinskiRenderer = new Points2DRenderer(program, sierpinski);
  let theta = 0;

  console.log(`Initialization successful! Sierpinski has ${sierpinski.length / 3} triangles.`);

  const render = () => {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    program.activate();
    sierpinskiRenderer.setupForDrawing();
    program.color.set([1, 0, 0.5, 1.0]);
    program.transform.set(new Matrix2D().rotate(theta));
    sierpinskiRenderer.draw();
    window.requestAnimationFrame(render);
    theta += 0.001;
  };

  render();
});
