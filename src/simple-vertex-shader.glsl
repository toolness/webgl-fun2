attribute vec4 a_position;

uniform mat4 u_transform;

void main() {
  gl_Position = a_position * u_transform;
}
