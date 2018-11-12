/**
 * Attributes
 *
 * These are passed into us and generally change
 * from one execution of our shader program to the next
 * during a render call.
 */

/** The position of the vertex, in object space. */
attribute vec4 a_position;

/**
 * Uniforms
 *
 * These are passed into us and do not change from
 * one execution of our shader program to the next
 * during a render call.
 */

/** The color of the vertex. */
uniform vec4 u_color;

/** Matrix to convert from eye space to clip coordinates. */
uniform mat4 u_projection_transform;

/** Matrix to convert from world space to eye space. */
uniform mat4 u_view_transform;

/** Matrix to convert from object space to world space. */
uniform mat4 u_model_transform;

/**
 * Varyings
 *
 * These are passed from us to the fragment shader.
 */

/** The color of the vertex. */
varying vec4 v_color;

void main() {
  gl_Position = u_projection_transform * u_view_transform * u_model_transform * a_position;
  v_color = u_color;
}
