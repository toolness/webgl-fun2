attribute vec4 a_position;

uniform mat3 u_transform;

void main() {
  vec3 pos2d = vec3(a_position.x, a_position.y, a_position.w) * u_transform;
  gl_Position = vec4(pos2d.x, pos2d.y, 0.0, pos2d.z);
}
