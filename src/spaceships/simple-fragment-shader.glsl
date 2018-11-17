precision mediump float;

/**
 * Uniforms
 *
 * These are passed into us and do not change from
 * one execution of our shader program to the next
 * during a render call.
 */

/** Whether to color the fragment based on its z-buffer location. */
uniform bool u_show_z_buffer;

/**
 * Varyings
 *
 * These are passed into us from the vertex shader.
 */

/** The color of the fragment. */
varying vec4 v_color;

void main() {
  if (u_show_z_buffer) {
    // This essentially visualizes the z-buffer. Taken from:
    //
    //   https://learnopengl.com/Advanced-OpenGL/Depth-testing
    gl_FragColor = vec4(vec3(gl_FragCoord.z), 1.0);
  } else {
    gl_FragColor = v_color;
  }
}
