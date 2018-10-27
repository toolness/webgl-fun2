const vertexShaderSrc = require("./simple-vertex-shader.glsl") as string;
const fragmentShaderSrc = require("./simple-fragment-shader.glsl") as string;

function fail(msg: string): Error {
  return new Error(msg);
}

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw fail("gl.createShader() failed!");

  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

  if (!success) {
    const msg = "Compiling shader failed: " + gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw fail(msg);
  }

  return shader;
}

function createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
  const program = gl.createProgram();
  if (!program) throw fail("gl.createProgram() failed!");
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!success) {
    const msg = "Linking program failed: " + gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw fail(msg);
  }

  return program;
}

window.addEventListener('load', () => {
  const canvas = document.createElement('canvas');

  document.body.appendChild(canvas);
  canvas.width = 400;
  canvas.height = 400;

  const gl = canvas.getContext('webgl');
  if (!gl) throw fail("webgl is not supported on this browser!");

  const vertexShader = createShader(gl, WebGLRenderingContext.VERTEX_SHADER, vertexShaderSrc);
  const fragmentShader = createShader(gl, WebGLRenderingContext.FRAGMENT_SHADER, fragmentShaderSrc);
  const program = createProgram(gl, vertexShader, fragmentShader);

  const colorUniLoc = gl.getUniformLocation(program, 'u_color');

  if (colorUniLoc === -1) throw fail("unable to find uniform u_color!");

  const posAttrLoc = gl.getAttribLocation(program, 'a_position');

  if (posAttrLoc === -1) throw fail("unable to find attribute a_position!");

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

  const primitiveType = gl.TRIANGLES;
  const drawOffset = 0;
  const count = 3;
  gl.drawArrays(primitiveType, drawOffset, count);

  console.log("Initialization successful!");
});
