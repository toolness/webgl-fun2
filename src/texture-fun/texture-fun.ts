import { GlProgram, getAttribLocation } from "../webgl";
import { getElement } from "../get-element";
import { Points3D } from "../points-3d";
import { Points3DRenderer } from "../points-3d-renderer";

const vertexShaderSrc = require("./texture-fun-vertex-shader.glsl") as string;
const fragmentShaderSrc = require("./texture-fun-fragment-shader.glsl") as string;

class TextureFunGlProgram extends GlProgram {
  readonly positionAttributeLocation: number;

  constructor(gl: WebGLRenderingContext) {
    super(gl, vertexShaderSrc, fragmentShaderSrc);
    this.positionAttributeLocation = getAttribLocation(gl, this.program, 'a_position');
  }
}

window.onload = () => {
  const canvas = getElement("canvas", "#canvas");
  const gl = canvas.getContext('webgl');

  if (!gl) throw new Error("webgl is not supported on this browser!");

  const program = new TextureFunGlProgram(gl);

  const square = Points3D.fromArray([
    // Top-left
    -1.0, 1.0, 0,
    // Bottom-left
    -1.0, -1.0, 0,
    // Bottom-right
    1.0, -1.0, 0,

    // Top-left
    -1.0, 1.0, 0,
    // Bottom-right
    1.0, -1.0, 0,
    // Top-right
    1.0, 1.0, 0
  ]);

  const renderer = new Points3DRenderer(program, square);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT);
  program.activate();
  renderer.setupForDrawing();
  renderer.draw();
}

