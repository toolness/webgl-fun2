import { GlProgram, setupBuffer, GlVertexArrayObject } from "./webgl";
import { Points3D } from "./points-3d";

export interface Points3DRendererProgram extends GlProgram {
  positionAttributeLocation: number;
}

export class Points3DRenderer {
  buffer: WebGLBuffer;
  vao: GlVertexArrayObject;

  constructor(readonly program: Points3DRendererProgram, readonly points: Points3D) {
    const { gl } = program;
    this.buffer = setupBuffer(gl, points.toFloat32Array());
    this.vao = new GlVertexArrayObject(gl);
    this.vao.bind();
    this.configureVertexArrayObject();
  }

  configureVertexArrayObject() {
    const { gl, positionAttributeLocation } = this.program;

    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

    const vertexSize = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.vertexAttribPointer(positionAttributeLocation, vertexSize, type, normalize, stride, offset);
  }

  setupForDrawing() {
    this.vao.bind();
  }

  draw(primitiveType: number = WebGLRenderingContext.TRIANGLES) {
    const { gl } = this.program;
    const drawOffset = 0;
    const count = this.points.length;
    gl.drawArrays(primitiveType, drawOffset, count);  
  }
}
