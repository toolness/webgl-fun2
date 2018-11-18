precision mediump float;

uniform float u_size;
uniform sampler2D u_sampler;

void main() {
  gl_FragColor = texture2D(u_sampler, vec2(gl_FragCoord.x / u_size, gl_FragCoord.y / u_size));
}
