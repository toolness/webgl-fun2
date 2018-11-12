precision mediump float;

uniform bool u_show_z_buffer;
uniform vec4 u_color;

void main() {
  if (u_show_z_buffer) {
    // This essentially visualizes the z-buffer. Taken from:
    //
    //   https://learnopengl.com/Advanced-OpenGL/Depth-testing
    gl_FragColor = vec4(vec3(gl_FragCoord.z), 1.0);
  } else {
    gl_FragColor = u_color;
  }
}
