import {Point2D} from "./models/Point2d";
import {add2D, scale2D, subtract2D} from "./util/math2d";
import {createProgram, createTextureFromArray} from "./util/webgl";

import fragSrc from "raw-loader!./frag.glsl";
import vertSrc from "raw-loader!./vert.glsl";


type FrameView = { min: Point2D, max: Point2D };

enum ShapeType {
    BoxFilled,
    BoxLined,
    CircleFilled,
    CircleLined,
    Cycled
}

const lineThickness = 1.0;
let shapeType = ShapeType.Cycled;

//const numDataPoints = 500;
//const pointSizeRange = [40, 100];
// For Benchmarking
const numDataPoints = 10e6;
const pointSizeRange = [4, 10];

const initialZoom = 1.0;
const imageSize: Point2D = {x: 1200, y: 800};
const canvas = document.getElementById("gl-canvas") as HTMLCanvasElement;
canvas.width = 1200;
canvas.height = 800;
canvas.style.width = `${canvas.width}px`;
canvas.style.height = `${canvas.height}px`

const frameTimeElement = document.getElementById("frame-time");

function GetRandomPoints(centerPoint: Point2D, w: number, h: number, sizeMin: number, sizeMax: number, numPoints: number) {
    const data = new Float32Array(numPoints * 4);
    for (let i = 0; i < numPoints; i++) {
        let x: number, y: number;
        data[i * 4] = centerPoint.x + (Math.random() - 0.5) * w;
        data[i * 4 + 1] = centerPoint.y + (Math.random() - 0.5) * h;
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


let center: Point2D = scale2D(imageSize, 0.5);
const maxZoom = 5;
let currentZoom = initialZoom;
let frameView = GetFrameView(center, currentZoom);


const gl = canvas.getContext("webgl2", {premultipliedAlpha: false}) as WebGL2RenderingContext;
gl.viewport(0, 0, canvas.width, canvas.height);
const webglPointSizeRange = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) as Float32Array;
console.log(`Can render points with pixel sizes from ${webglPointSizeRange[0]} to ${webglPointSizeRange[1]}`);

gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
const glProgram = createProgram(gl, vertSrc, fragSrc);
gl.useProgram(glProgram);

const ShaderUniforms = {
    vertexId: gl.getAttribLocation(glProgram, "vertexId"),
    numVertices: gl.getUniformLocation(glProgram, "numVertices"),
    zoomLevel: gl.getUniformLocation(glProgram, "zoomLevel"),
    lineThickness: gl.getUniformLocation(glProgram, "lineThickness"),
    shapeType: gl.getUniformLocation(glProgram, "shapeType"),
    scalePointsWithZoom: gl.getUniformLocation(glProgram, "scalePointsWithZoom"),
    frameViewMin: gl.getUniformLocation(glProgram, "frameViewMin"),
    frameViewMax: gl.getUniformLocation(glProgram, "frameViewMax"),
    positionTexture: gl.getUniformLocation(glProgram, "positionTexture")
}

let dataPoints = GetRandomPoints(center, imageSize.x, imageSize.y, pointSizeRange[0], pointSizeRange[1], numDataPoints);
const {texture: dataTexture, width, height} = createTextureFromArray(gl, dataPoints, gl.TEXTURE0, 4);
console.log(dataPoints.length);
console.log(width);
console.log(height);

gl.uniform1i(ShaderUniforms.numVertices, dataPoints.length / 3);


let prevTimestamp: number = undefined;
let autoplay = false;

canvas.onwheel = (ev => {
    const dy = ev.deltaY;
    currentZoom -= 0.005 * dy;
    currentZoom = Math.max(0.00, currentZoom);
});

canvas.onclick = () => {
    autoplay = !autoplay;
}


function render(t: number) {
    let dt = 0;
    if (prevTimestamp !== undefined) {
        dt = t - prevTimestamp;
    }
    prevTimestamp = t;

    if (autoplay) {
        currentZoom += 0.001 * dt;
        if (currentZoom > maxZoom) {
            currentZoom = initialZoom;
        }
    }

    // For alpha blending (soft lines)
    // gl.enable(gl.BLEND);
    // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    frameView = GetFrameView(center, currentZoom);
    gl.uniform2f(ShaderUniforms.frameViewMin, frameView.min.x, frameView.min.y);
    gl.uniform2f(ShaderUniforms.frameViewMax, frameView.max.x, frameView.max.y);
    gl.uniform1f(ShaderUniforms.zoomLevel, currentZoom);
    gl.uniform1f(ShaderUniforms.lineThickness, lineThickness);
    gl.uniform1i(ShaderUniforms.scalePointsWithZoom, 0);


    // Cycle through shape types
    if (shapeType === ShapeType.Cycled) {
        gl.uniform1i(ShaderUniforms.shapeType, t / 2000 % 4.0);
    } else {
        gl.uniform1i(ShaderUniforms.shapeType, shapeType);
    }
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, dataTexture);
    gl.uniform1i(ShaderUniforms.positionTexture, 0);
    gl.drawArrays(gl.POINTS, 0, dataPoints.length / 4);
    gl.finish();
    // Update info
    const fps = 1000.0 / dt;
    frameTimeElement.textContent = `${(numDataPoints / 1e6).toFixed(1)} million data points. Frame time: ${dt.toFixed(2)}; FPS: ${fps.toFixed(2)}`;

    requestAnimationFrame(render);
}

requestAnimationFrame(render);


