precision mediump float;

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

/** The vertex's normal in object space. */
uniform vec4 u_normal;

/** The position of the light in world coordinates. */
uniform vec4 u_light;

/**
 * Whether or not to actually shade the vertex based on
 * the current lighting.
 */
uniform bool u_shade;

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

  float light_amount = 1.0;

  if (u_shade) {
    float ambient_light_amount = 0.25;
    float max_illumination = 1.0 - ambient_light_amount;

    // The surface normal, in world space.
    vec4 world_normal = normalize(
      u_model_transform * u_normal -
      u_model_transform * vec4(0, 0, 0, 1)
    );

    // The direction from the origin to the light source, in world space.
    vec4 world_light = normalize(u_light);

    // Based on the angle between the surface normal and the
    // light, shade the vertex accordingly.
    //
    // Note that we're taking the absolute value of the dot
    // product because we're assuming that the shape we're
    // drawing is two-sided, and that the side of the shape
    // visible to the user is also the side that faces the
    // light.
    float illumination = abs(dot(world_normal, world_light));

    light_amount = ambient_light_amount + illumination * max_illumination;
  }

  v_color = vec4(light_amount * vec3(u_color), 1.0);
}
