import { GlProgram } from "./webgl";
import { Points2D } from "./points-2d";

export interface Points2DRendererProgram extends GlProgram {
  positionAttributeLocation: number;
}

export class Points2DRenderer {
  buffer: WebGLBuffer;

  constructor(readonly program: Points2DRendererProgram, readonly points: Points2D) {
    const { gl } = program;
    const buffer = gl.createBuffer();

    if (buffer === null) {
      throw new Error("gl.createBuffer() failed!");
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, points.toFloat32Array(), gl.STATIC_DRAW);

    this.buffer = buffer;
  }

  draw() {
    const { gl, positionAttributeLocation } = this.program;

    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

    const vertexSize = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.vertexAttribPointer(positionAttributeLocation, vertexSize, type, normalize, stride, offset);

    const primitiveType = gl.TRIANGLES;
    const drawOffset = 0;
    const count = this.points.length;
    gl.drawArrays(primitiveType, drawOffset, count);  
  }
}
