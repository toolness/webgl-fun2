import { Points } from "./points";

const simpleVertexShaderSrc = require("./simple-vertex-shader.glsl") as string;
const simpleFragmentShaderSrc = require("./simple-fragment-shader.glsl") as string;

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("gl.createShader() failed!");

  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

  if (!success) {
    const msg = "Compiling shader failed: " + gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(msg);
  }

  return shader;
}

function createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
  const program = gl.createProgram();
  if (!program) throw new Error("gl.createProgram() failed!");
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!success) {
    const msg = "Linking program failed: " + gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(msg);
  }

  return program;
}

function getUniformLocation(gl: WebGLRenderingContext, program: WebGLProgram, name: string): WebGLUniformLocation {
  const loc = gl.getUniformLocation(program, name);

  if (loc === null) {
    throw new Error(`Unable to find uniform '${name}'!`);
  }

  return loc;
}

function getAttribLocation(gl: WebGLRenderingContext, program: WebGLProgram, name: string): number {
  const loc = gl.getAttribLocation(program, name);

  if (loc === -1) {
    throw new Error(`Unable to find attribute '${name}'!`);
  }

  return loc;
}

function makeSpaceship(): Points {
  const leftHalf = Points.fromArray([
    -0.5, 0,
    0, 0.75,
    0, 0.15
  ]);
  return leftHalf.concat(leftHalf.mirrorHorizontally());
}

class GlProgram {
  readonly program: WebGLProgram;

  constructor(readonly gl: WebGLRenderingContext, vertexShaderSrc: string, fragmentShaderSrc: string) {
    const vertexShader = createShader(gl, WebGLRenderingContext.VERTEX_SHADER, vertexShaderSrc);
    const fragmentShader = createShader(gl, WebGLRenderingContext.FRAGMENT_SHADER, fragmentShaderSrc);
    this.program = createProgram(gl, vertexShader, fragmentShader);
  }

  activate() {
    this.gl.useProgram(this.program);
  }
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

class GlUniformVector {
  location: WebGLUniformLocation;

  constructor(readonly program: GlProgram, name: string) {
    this.location = getUniformLocation(program.gl, program.program, name);
  }

  set(value: Float32List) {
    this.program.gl.uniform4fv(this.location, value);
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
