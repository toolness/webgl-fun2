attribute vec4 a_position;

uniform mat4 u_transform;

void main() {
  // Normally we'd want to do u_transform * a_position, because that's how
  // we'd do it in our engine. However, our engine uses column vectors, not
  // row vectors, and I'm also unclear on whether WebGL/GLSL expects
  // matrices to be laid out in row-major or column-major order, and whether
  // it treats vectors as row or column vectors.
  //
  // Regardless, the following appears to work.
  //
  // At least I'm not alone on this and this confusion goes back to 1993:
  //
  //   http://steve.hollasch.net/cgindex/math/matrix/column-vec.html
  vec4 non_homogeneous_position = a_position * u_transform;

  // Our transformation matrix gave us a vector whose homogeneous component
  // is z, not 1, so we want to multiply it by the inverse of the homogeneous
  // component to complete the perspective transformation.
  gl_Position = (1.0 / non_homogeneous_position.w) * non_homogeneous_position;

  // Uh, except our z component is now 1, which will make depth buffer
  // comparisons useless, so let's restore the original z-value.
  gl_Position.z = non_homogeneous_position.z;
}
