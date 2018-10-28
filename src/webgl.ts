import { Matrix2D } from "./matrix-2d";

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

export class GlUniformVector extends GlUniformBase {
  set(value: Float32List) {
    this.program.gl.uniform4fv(this.location, value);
  }
}

export class GlUniformFloat extends GlUniformBase {
  set(value: number) {
    this.program.gl.uniform1f(this.location, value);
  }
}

export class GlUniformMatrix2D extends GlUniformBase {
  set(value: Matrix2D) {
    this.program.gl.uniformMatrix3fv(this.location, false, value.toFloat32Array());
  }
}
