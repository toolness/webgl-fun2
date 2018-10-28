attribute vec4 a_position;

uniform mat4 u_transform;

void main() {
  vec4 non_homogeneous_position = u_transform * a_position;

  // Our transformation matrix gave us a vector whose homogeneous component
  // is z, not 1, so we want to multiply it by the inverse of the homogeneous
  // component to complete the perspective transformation.
  gl_Position = (1.0 / non_homogeneous_position.w) * non_homogeneous_position;

  // Uh, except our z component is now 1, which will make depth buffer
  // comparisons useless, so let's restore the original z-value.
  gl_Position.z = non_homogeneous_position.z;
}
