#version 300 es
precision highp float;

uniform float lineThickness;
uniform int shapeType;

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

void main() {
    vec2 posPixelSpace = (0.5 - gl_PointCoord) * v_pointSize;

    float rMax = v_pointSize * 0.5;
    bool shouldDrawPoint = false;
    switch (shapeType) {
        case BOX_FILLED:
        shouldDrawPoint = true;
        break;
        case BOX_LINED:
        shouldDrawPoint = abs(posPixelSpace.x) > rMax - lineThickness || abs(posPixelSpace.y) > rMax - lineThickness;
        break;
        case CIRCLE_FILLED:
        shouldDrawPoint = radiusInRange(posPixelSpace, v_pointSize * 0.5);
        break;
        case CIRCLE_LINED:
        shouldDrawPoint = radiusInRange(posPixelSpace, rMax - lineThickness, rMax);
        break;
    }

    // Blending
    // outColor = vec4(v_colour.xyz, shouldDrawPoint ? 1.0 : 0.0);

    // Discarding
    if (shouldDrawPoint) {
        outColor = v_colour;
    } else {
        discard;
    }
}