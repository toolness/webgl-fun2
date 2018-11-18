precision mediump float;

uniform float u_size;
uniform float u_phase;
uniform sampler2D u_sampler;

const float PI = 3.1415926535897932384626433832795;

void main() {
  float u = gl_FragCoord.x / u_size;
  float v = gl_FragCoord.y / u_size;
  float vShiftAmount = sin(gl_FragCoord.x / u_size * PI + u_phase);

  v += vShiftAmount * 0.1;

  gl_FragColor = texture2D(u_sampler, vec2(u, v));
}
