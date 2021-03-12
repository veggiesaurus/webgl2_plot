const GL = WebGL2RenderingContext;

export function compileShader(gl: WebGL2RenderingContext, shaderScript: string, type: number) {
    if (!gl || !shaderScript || !(type === GL.VERTEX_SHADER || type === GL.FRAGMENT_SHADER)) {
        return null;
    }

    let shader = gl.createShader(type);
    gl.shaderSource(shader, shaderScript);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, GL.COMPILE_STATUS)) {
        console.log(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

export function createProgram(gl: WebGL2RenderingContext, vertexShaderString: string, pixelShaderString: string) {
    if (!gl) {
        return null;
    }

    let vertexShader = compileShader(gl, vertexShaderString, GL.VERTEX_SHADER);
    let fragmentShader = compileShader(gl, pixelShaderString, GL.FRAGMENT_SHADER);

    let shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, GL.LINK_STATUS)) {
        console.log("Could not initialise shaders");
        return null;
    }
    return shaderProgram;
}

export function createTextureFromArray(gl: WebGL2RenderingContext, data: Float32Array, texIndex: number = GL.TEXTURE0, components: number = 1) {
    const numPoints = data.length / components;

    if (data.length % components !== 0) {
        console.error(`Invalid data size (${data.length} for number of components ${components}`);
        return null;
    }

    // Attempt to make a square texture by default
    let width = Math.ceil(Math.sqrt(numPoints));
    let height = Math.ceil(numPoints / width);

    let paddedData: Float32Array;
    if (width * height === numPoints) {
        paddedData = data;
    } else {
        paddedData = new Float32Array(width * height * components);
        paddedData.set(data, 0);
        console.log(`Padding data texture from ${numPoints} to ${width * height}`);
    }

    const texture = gl.createTexture();
    gl.activeTexture(texIndex);
    gl.bindTexture(GL.TEXTURE_2D, texture);
    switch (components) {
        case 1:
            gl.texImage2D(GL.TEXTURE_2D, 0, GL.R32F, width, height, 0, GL.RED, GL.FLOAT, paddedData);
            break;
        case 2:
            gl.texImage2D(GL.TEXTURE_2D, 0, GL.RG32F, width, height, 0, GL.RG, GL.FLOAT, paddedData);
            break;
        case 3:
            gl.texImage2D(GL.TEXTURE_2D, 0, GL.RGB32F, width, height, 0, GL.RGB, GL.FLOAT, paddedData);
            break;
        case 4:
            gl.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA32F, width, height, 0, GL.RGBA, GL.FLOAT, paddedData);
            break;
        default:
            console.error(`Invalid number of components specified: ${components}`);
            return null;
    }
    gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST);
    gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.NEAREST);
    gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
    gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
    return {texture, width, height};
}