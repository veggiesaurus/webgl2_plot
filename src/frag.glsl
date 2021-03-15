#version 300 es
precision highp float;

uniform float lineThickness;
uniform int shapeType;
uniform float featherWidth;

#define BOX_FILLED 0
#define BOX_LINED 1
#define CIRCLE_FILLED 2
#define CIRCLE_LINED 3

in vec4 v_colour;
in float v_pointSize;
out vec4 outColor;

float featherRange(vec2 a, float rMax) {
    float r = length(a);
    float v = (rMax - r - featherWidth) / (2.0 * featherWidth);
    return smoothstep(0.0, 1.0, v);
}

float featherRange(vec2 a, float rMin, float rMax) {
    float r = length(a);
    vec2 v = (vec2(rMax, rMin) - r - featherWidth) / (2.0 * featherWidth);
    vec2 alpha = smoothstep(0.0, 1.0, v);
    // subtract inner feathered circle
    return (alpha.x) * (1.0 - alpha.y);
}

float featherRangeSquare(vec2 r, float rMax) {
    vec2 v = (rMax - abs(r) - featherWidth) / (2.0 * featherWidth);
    vec2 alpha = smoothstep(0.0, 1.0, v);
    return alpha.x * alpha.y;
}

float featherRangeSquare(vec2 r, float rMin, float rMax) {
    vec2 v = (rMax - abs(r) - featherWidth) / (2.0 * featherWidth);
    vec2 v2 = (rMin - abs(r) - featherWidth) / (2.0 * featherWidth);
    vec2 alpha = smoothstep(0.0, 1.0, v);
    vec2 alpha2 = smoothstep(0.0, 1.0, v2);
    // subtract inner feathered square
    return (alpha.x * alpha.y) * (1.0 - (alpha2.x * alpha2.y));
}

void main() {
    vec2 posPixelSpace = (0.5 - gl_PointCoord) * (v_pointSize + featherWidth);

    float rMax = v_pointSize * 0.5;
    float rMin = rMax - lineThickness;
    bool shouldDrawPoint = false;
    float alpha = 1.0;
    switch (shapeType) {
        case BOX_FILLED:
        alpha = featherRangeSquare(posPixelSpace, rMax);
        break;
        case BOX_LINED:
        alpha = featherRangeSquare(posPixelSpace, rMin, rMax);
        break;
        case CIRCLE_FILLED:
        alpha = featherRange(posPixelSpace, rMax);
        break;
        case CIRCLE_LINED:
        alpha = featherRange(posPixelSpace, rMin, rMax);
        break;
    }

    // Blending
    outColor = vec4(v_colour.xyz, alpha);
}