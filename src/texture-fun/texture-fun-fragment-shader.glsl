precision mediump float;

uniform sampler2D u_sampler;

void main() {
  gl_FragColor = texture2D(u_sampler, vec2(0.0, 0.0));
}
