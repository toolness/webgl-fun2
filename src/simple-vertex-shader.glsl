attribute vec4 a_position;

uniform vec4 u_translate;
uniform float u_rotate;

void main() {
  gl_Position = vec4(
    // Deriving the rotation requires angle sum identities:
    // https://en.wikipedia.org/wiki/List_of_trigonometric_identities#Angle_sum_and_difference_identities
    a_position.x * cos(u_rotate) - a_position.y * sin(u_rotate) + u_translate.x,
    a_position.x * sin(u_rotate) + a_position.y * cos(u_rotate) + u_translate.y,
    0.0,
    1.0
  );
}
