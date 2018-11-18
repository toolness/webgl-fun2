import { Matrix3D } from "./matrix-3d";
import { Vector3D } from "./vector-3d";

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

export function getAttribLocation(gl: WebGLRenderingContext, program: WebGLProgram, name: string): number {
  const loc = gl.getAttribLocation(program, name);

  if (loc === -1) {
    throw new Error(`Unable to find attribute '${name}'!`);
  }

  return loc;
}

export class GlProgram {
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

class GlUniformBase {
  location: WebGLUniformLocation;

  constructor(readonly program: GlProgram, name: string) {
    this.location = getUniformLocation(program.gl, program.program, name);
  }
}

export class GlUniformVector3D extends GlUniformBase {
  set(value: Vector3D) {
    this.program.gl.uniform4fv(this.location, [value.x, value.y, value.z, value.w]);
  }
}

export class GlUniformFloat extends GlUniformBase {
  set(value: number) {
    this.program.gl.uniform1f(this.location, value);
  }
}

export class GlUniformMatrix3D extends GlUniformBase {
  set(value: Matrix3D) {
    this.program.gl.uniformMatrix4fv(this.location, false, value.toFloat32Array());
  }
}

export class GlUniformBoolean extends GlUniformBase {
  set(value: boolean) {
    this.program.gl.uniform1f(this.location, value ? 1 : 0);
  }
}

export class GlUniformInteger extends GlUniformBase {
  set(value: number) {
    this.program.gl.uniform1i(this.location, value);
  }
}

export function setupBuffer(gl: WebGLRenderingContext, value: Float32Array): WebGLBuffer {
  const buffer = gl.createBuffer();

  if (buffer === null) {
    throw new Error("gl.createBuffer() failed!");
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, value, gl.STATIC_DRAW);

  return buffer;
}

function isPowerOfTwo(value: number): boolean {
  const log2 = Math.log2(value);
  return log2 === Math.floor(log2);
}

export function setupTexture(gl: WebGLRenderingContext, pixels: ArrayBufferView, width: number, height?: number): WebGLTexture {
  const texture = gl.createTexture();

  if (texture === null) {
    throw new Error("gl.createTexture() failed!");
  }

  if (!height) {
    height = width;
  }

  if (!(isPowerOfTwo(width) && isPowerOfTwo(height))) {
    throw new Error("Texture dimensions must be powers of two!");
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  return texture;
}
