import {compileShader, createProgram, createTextureFromArray} from "./util/webgl";

import fragSrc from "raw-loader!./frag.glsl";
import vertSrc from "raw-loader!./vert.glsl";
import {Point2D} from "./models/Point2d";
import {add2D, scale2D, subtract2D} from "./util/math2d";

type FrameView = { min: Point2D, max: Point2D };

const imageSize: Point2D = {x: 600, y: 400};
const canvas = document.getElementById("gl-canvas") as HTMLCanvasElement;
canvas.width = 600;
canvas.height = 400;


function GetRandomPoints(centerPoint: Point2D, radius: number, sizeMin: number, sizeMax: number, numPoints: number) {
    const data = new Float32Array(numPoints * 4);
    for (let i = 0; i < numPoints; i++) {
        let validPoint = false;
        let x: number, y: number;
        while (!validPoint) {
            // x and y in range [-1, 1]
            x = 2 * Math.random() - 1;
            y = 2 * Math.random() - 1;
            // check if it's in the circle
            validPoint = x * x + y * y < 1;
        }
        data[i * 4] = centerPoint.x + radius * x;
        data[i * 4 + 1] = centerPoint.y + radius * y;
        // Random size in range [sizeMin, sizeMax]
        data[i * 4 + 2] = Math.random() * (sizeMax - sizeMin) + sizeMin;
        // Random colourmap value in range [0, 1]
        data[i * 4 + 3] = Math.random();
    }
    return data;
}

function GetFrameView(centerPoint: Point2D, zoomLevel: number): FrameView {
    const croppedSize = scale2D(imageSize, 1.0 / zoomLevel);
    return {
        min: subtract2D(centerPoint, scale2D(croppedSize, 0.5)),
        max: add2D(centerPoint, scale2D(croppedSize, 0.5))
    }
}


let center: Point2D = {x: 300, y: 200};
let currentZoom = 0.1;
let frameView = GetFrameView(center, currentZoom);


const gl = canvas.getContext("webgl2", {premultipliedAlpha: false}) as WebGL2RenderingContext;
gl.viewport(0, 0, canvas.width, canvas.height);
const pointSizeRange = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) as Float32Array;
console.log(`Can render points with pixel sizes from ${pointSizeRange[0]} to ${pointSizeRange[1]}`);

gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
const glProgram = createProgram(gl, vertSrc, fragSrc);
gl.useProgram(glProgram);

const ShaderUniforms = {
    vertexId: gl.getAttribLocation(glProgram, "vertexId"),
    numVertices: gl.getUniformLocation(glProgram, "numVertices"),
    zoomLevel: gl.getUniformLocation(glProgram, "zoomLevel"),
    scalePointsWithZoom: gl.getUniformLocation(glProgram, "scalePointsWithZoom"),
    frameViewMin: gl.getUniformLocation(glProgram, "frameViewMin"),
    frameViewMax: gl.getUniformLocation(glProgram, "frameViewMax"),
    positionTexture: gl.getUniformLocation(glProgram, "positionTexture")
}

let dataPoints = GetRandomPoints({x: 300, y: 200}, 200, 2, 5, 1e6);
const {texture: dataTexture, width, height} = createTextureFromArray(gl, dataPoints, gl.TEXTURE0, 4);
console.log(dataPoints.length);
console.log(width);
console.log(height);

gl.uniform1i(ShaderUniforms.numVertices, dataPoints.length / 3);


let prevTimestamp: number = undefined;

canvas.onwheel = (ev => {
    const dy = ev.deltaY;
    currentZoom -= 0.005 * dy;
    currentZoom = Math.max(0.00, currentZoom);
});


function render(t: number) {
    let dt = 0;
    if (prevTimestamp !== undefined) {
        dt = t - prevTimestamp;
    }
    prevTimestamp = t;

    currentZoom += 0.001 * dt;
    if (currentZoom > 10) {
        currentZoom = 1;
    }

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    frameView = GetFrameView(center, currentZoom);
    gl.uniform2f(ShaderUniforms.frameViewMin, frameView.min.x, frameView.min.y);
    gl.uniform2f(ShaderUniforms.frameViewMax, frameView.max.x, frameView.max.y);
    gl.uniform1f(ShaderUniforms.zoomLevel, currentZoom);
    gl.uniform1i(ShaderUniforms.scalePointsWithZoom, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, dataTexture);
    gl.uniform1i(ShaderUniforms.positionTexture, 0);
    gl.drawArrays(gl.POINTS, 0, dataPoints.length / 2);

    requestAnimationFrame(render);
}

requestAnimationFrame(render);


