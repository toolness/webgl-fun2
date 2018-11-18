import { GlProgram, getAttribLocation, GlUniformInteger, GlUniformFloat } from "../webgl";
import { getElement } from "../get-element";
import { Points3D } from "../points-3d";
import { Points3DRenderer } from "../points-3d-renderer";

const vertexShaderSrc = require("./texture-fun-vertex-shader.glsl") as string;
const fragmentShaderSrc = require("./texture-fun-fragment-shader.glsl") as string;

const TEXTURE_SIZE = 64;

class TextureFunGlProgram extends GlProgram {
  readonly positionAttributeLocation: number;
  readonly sampler: GlUniformInteger;
  readonly size: GlUniformFloat;
  readonly phase: GlUniformFloat;

  constructor(gl: WebGLRenderingContext) {
    super(gl, vertexShaderSrc, fragmentShaderSrc);
    this.positionAttributeLocation = getAttribLocation(gl, this.program, 'a_position');
    this.sampler = new GlUniformInteger(this, 'u_sampler');
    this.size = new GlUniformFloat(this, 'u_size');
    this.phase = new GlUniformFloat(this, 'u_phase');
  }
}

function makeTexture(size: number) {
  const buffer = new Uint8Array(size * size * 4);
  const GRADIENT_LENGTH = 8;
  let i = 0;

  for (let y = 0; y < size; y++) {
    const yGrad = Math.floor((y % GRADIENT_LENGTH) / GRADIENT_LENGTH * 255);
    for (let x = 0; x < size; x++) {
      const red = yGrad;
      const green = 0;
      const blue = 90;
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
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, TEXTURE_SIZE, TEXTURE_SIZE, 0, gl.RGBA, gl.UNSIGNED_BYTE, textureData);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  let phase = 0.0;

  const render = () => {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    program.activate();
    program.size.set(canvas.width);
    renderer.setupForDrawing();

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    program.sampler.set(0);
    program.phase.set(phase);

    renderer.draw();

    phase += 0.025;
    window.requestAnimationFrame(render);
  };

  render();
}
