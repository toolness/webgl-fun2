precision mediump float;

void main() {
  gl_FragColor = vec4(gl_FragCoord.x / 800.0, 0.0, gl_FragCoord.y / 800.0, 1.0);
}
