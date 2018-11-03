precision mediump float;

void main() {
  // This essentially visualizes the z-buffer. Taken from:
  //
  //   https://learnopengl.com/Advanced-OpenGL/Depth-testing
  gl_FragColor = vec4(vec3(gl_FragCoord.z), 1.0);
}
