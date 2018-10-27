const vertexShaderSrc = require("./simple-vertex-shader.glsl") as string;
const fragmentShaderSrc = require("./simple-fragment-shader.glsl") as string;

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

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.createElement('canvas');

  document.body.appendChild(canvas);
  canvas.width = 400;
  canvas.height = 400;
  canvas.style.border = '1px solid black';

  const gl = canvas.getContext('webgl');
  if (!gl) throw new Error("webgl is not supported on this browser!");

  const vertexShader = createShader(gl, WebGLRenderingContext.VERTEX_SHADER, vertexShaderSrc);
  const fragmentShader = createShader(gl, WebGLRenderingContext.FRAGMENT_SHADER, fragmentShaderSrc);
  const program = createProgram(gl, vertexShader, fragmentShader);

  const colorUniLoc = getUniformLocation(gl, program, 'u_color');
  const translateUniLoc = getUniformLocation(gl, program, 'u_translate');
  const posAttrLoc = getAttribLocation(gl, program, 'a_position');

  const posBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  const positions = [
    0, 0,
    0, 0.5,
    0.7, 0
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program);
  gl.enableVertexAttribArray(posAttrLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  
  const size = 2;
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;
  gl.vertexAttribPointer(posAttrLoc, size, type, normalize, stride, offset);
  gl.uniform4f(colorUniLoc, 1, 0, 0.5, 1.0);
  gl.uniform4f(translateUniLoc, 0, -0.5, 0, 0);

  const primitiveType = gl.TRIANGLES;
  const drawOffset = 0;
  const count = 3;
  gl.drawArrays(primitiveType, drawOffset, count);

  console.log("Initialization successful!");
});
