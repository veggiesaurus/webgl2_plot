#version 300 es
precision highp float;

uniform int numVertices;
uniform vec2 frameViewMin;
uniform vec2 frameViewMax;
uniform float zoomLevel;
uniform bool scalePointsWithZoom;
uniform sampler2D positionTexture;

out vec4 v_colour;
out float v_pointSize;

#define PI radians(180.0)

vec4 getValueByIndexFromTexture(sampler2D texture, int index) {
    ivec2 size = textureSize(texture, 0);
    int row = index / size.x;
    int col = index - row * size.x;
    return texelFetch(texture, ivec2(col, row), 0);
}

vec2 imageToGL(vec2 imageVec) {
    return 2.0 * (imageVec - frameViewMin) / (frameViewMax - frameViewMin) - 1.0;
}

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    vec4 data = getValueByIndexFromTexture(positionTexture, gl_VertexID);
    vec2 pos = data.xy;
    float size = data.z;
    float cmapVal = data.w;

    gl_Position = vec4(imageToGL(pos), 0, 1);
    if (scalePointsWithZoom) {
        v_pointSize = size * zoomLevel;
    } else {
        v_pointSize = size;
    }
    gl_PointSize = v_pointSize;
    v_colour = vec4(hsv2rgb(vec3(cmapVal, 0.5, 1.0)), 1.0);

}