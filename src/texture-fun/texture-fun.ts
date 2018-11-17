import { GlProgram, getAttribLocation, GlUniformInteger } from "../webgl";
import { getElement } from "../get-element";
import { Points3D } from "../points-3d";
import { Points3DRenderer } from "../points-3d-renderer";

const vertexShaderSrc = require("./texture-fun-vertex-shader.glsl") as string;
const fragmentShaderSrc = require("./texture-fun-fragment-shader.glsl") as string;

const TEXTURE_SIZE = 256;

class TextureFunGlProgram extends GlProgram {
  readonly positionAttributeLocation: number;
  readonly sampler: GlUniformInteger;

  constructor(gl: WebGLRenderingContext) {
    super(gl, vertexShaderSrc, fragmentShaderSrc);
    this.positionAttributeLocation = getAttribLocation(gl, this.program, 'a_position');
    this.sampler = new GlUniformInteger(this, 'u_sampler');
  }
}

function makeTexture(size: number) {
  const buffer = new Uint8Array(size * size * 4);
  const GRADIENT_LENGTH = 4;
  let i = 0;

  for (let y = 0; y < size; y++) {
    const yGrad = Math.floor((y % GRADIENT_LENGTH) / GRADIENT_LENGTH * 255);
    for (let x = 0; x < size; x++) {
      const red = yGrad;
      const green = 0;
      const blue = 255;
      const alpha = 255;

      buffer[i] = red;
      buffer[i + 1] = green;
      buffer[i + 2] = blue;
      buffer[i + 3] = alpha;
      i += 4;
    }
  }

  return buffer;
}

window.onload = () => {
  const canvas = getElement("canvas", "#canvas");
  const gl = canvas.getContext('webgl');

  if (!gl) throw new Error("webgl is not supported on this browser!");

  const program = new TextureFunGlProgram(gl);

  const textureData = makeTexture(TEXTURE_SIZE);
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

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, TEXTURE_SIZE, TEXTURE_SIZE, 0, gl.RGBA, gl.UNSIGNED_BYTE, textureData);
  gl.generateMipmap(gl.TEXTURE_2D);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  program.sampler.set(0);

  renderer.draw();
}
