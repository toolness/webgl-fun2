import { Points } from "./points";
import { GlUniformVector, GlProgram, getAttribLocation } from "./webgl";

const simpleVertexShaderSrc = require("./simple-vertex-shader.glsl") as string;
const simpleFragmentShaderSrc = require("./simple-fragment-shader.glsl") as string;

function makeSpaceship(): Points {
  const leftHalf = Points.fromArray([
    -0.5, 0,
    0, 0.75,
    0, 0.15
  ]);
  return leftHalf.concat(leftHalf.mirrorHorizontally());
}

class SimpleGlProgram extends GlProgram {
  readonly color: GlUniformVector;
  readonly translate: GlUniformVector;
  readonly positionAttributeLocation: number;

  constructor(gl: WebGLRenderingContext) {
    super(gl, simpleVertexShaderSrc, simpleFragmentShaderSrc);
    this.color = new GlUniformVector(this, 'u_color');
    this.translate = new GlUniformVector(this, 'u_translate');
    this.positionAttributeLocation = getAttribLocation(gl, this.program, 'a_position');
  }
}

class PointsDrawer {
  buffer: WebGLBuffer;

  constructor(readonly gl: WebGLRenderingContext, readonly points: Points) {
    const buffer = gl.createBuffer();

    if (buffer === null) {
      throw new Error("gl.createBuffer() failed!");
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, points.toFloat32Array(), gl.STATIC_DRAW);

    this.buffer = buffer;
  }

  draw(attributeLocation: number) {
    const { gl } = this;

    gl.enableVertexAttribArray(attributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

    const vertexSize = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.vertexAttribPointer(attributeLocation, vertexSize, type, normalize, stride, offset);
  
    const primitiveType = gl.TRIANGLES;
    const drawOffset = 0;
    const count = this.points.length;
    gl.drawArrays(primitiveType, drawOffset, count);  
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
  const spaceship = new PointsDrawer(gl, makeSpaceship());

  console.log("Initialization successful!");

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  program.activate();
  program.color.set([1, 0, 0.5, 1.0])
  program.translate.set([0, 0, 0, 0]);
  spaceship.draw(program.positionAttributeLocation);
});
