#version 300 es
precision highp float;
in vec4 v_colour;

out vec4 outColor;

void main() {
    vec2 pos = 0.5 - gl_PointCoord;
    if (length(pos) <= 0.5f) {
        outColor = v_colour;
    } else {
        outColor = vec4(0, 0, 0, 0);
        //discard;
    }
}