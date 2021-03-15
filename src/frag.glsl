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


float lenSquared(vec2 a) {
    return dot(a, a);
}

bool radiusInRange(vec2 a, float rMin, float rMax) {
    float r2 = lenSquared(a);
    return r2 > rMin * rMin && r2 < rMax * rMax;
}

bool radiusInRange(vec2 a, float rMax) {
    float r2 = lenSquared(a);
    return r2 < rMax * rMax;
}

float featherRange(vec2 a, float rMax) {
    float r = length(a);
    float v = (rMax - r - featherWidth * 0.5) / featherWidth;
    return smoothstep(0.0, 1.0, v);
}

float featherRangeSquare(vec2 r, float rMax) {
    vec2 v = (rMax - abs(r) - featherWidth * 0.5) / featherWidth;
    vec2 alpha = smoothstep(0.0, 1.0, v);
    return alpha.x * alpha.y;
}

void main() {
    vec2 posPixelSpace = (0.5 - gl_PointCoord) * (v_pointSize + featherWidth * 0.5);

    float rMax = v_pointSize * 0.5;
    bool shouldDrawPoint = false;
    float alpha = 1.0;
    switch (shapeType) {
        case BOX_FILLED:
        alpha = featherRangeSquare(posPixelSpace, rMax);
        break;
        case BOX_LINED:
        shouldDrawPoint = abs(posPixelSpace.x) > rMax - lineThickness || abs(posPixelSpace.y) > rMax - lineThickness;
        break;
        case CIRCLE_FILLED:
        alpha = featherRange(posPixelSpace, rMax);
        break;
        case CIRCLE_LINED:
        shouldDrawPoint = radiusInRange(posPixelSpace, rMax - lineThickness, rMax);
        break;
    }

    // Blending
    outColor = vec4(v_colour.xyz, alpha);

    // Discarding
    //    if (shouldDrawPoint) {
    //        outColor = v_colour;
    //    } else {
    //        discard;
    //    }
}