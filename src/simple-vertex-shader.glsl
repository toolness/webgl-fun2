attribute vec4 a_position;

uniform vec4 u_translate;

void main() {
  gl_Position = a_position + u_translate;
}
