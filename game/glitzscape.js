var gl;
var shaderProgram;
var shaderProgram1;
var invert = false;

function initGL(canvas) 
{
    try 
    {
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } 
    catch (e) 
    {
    }
    
    if (!gl) 
    {
        alert("No WebGL for you");
    }
}

function getShader(gl, src, type) 
{
    var shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) 
    {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function initShader(fragmentShader, vertexShader)
{
    var sp = gl.createProgram();
    gl.attachShader(sp, vertexShader);
    gl.attachShader(sp, fragmentShader);
    gl.linkProgram(sp);

    if (!gl.getProgramParameter(sp, gl.LINK_STATUS)) 
    {
        alert("Could not initialise shaders");
    }


    sp.vertexPositionAttribute = gl.getAttribLocation(sp, "aVertexPosition");
    gl.enableVertexAttribArray(sp.vertexPositionAttribute);

    sp.textureCoordAttribute = gl.getAttribLocation(sp, "aTextureCoord");
    gl.enableVertexAttribArray(sp.textureCoordAttribute);

    sp.pMatrixUniform = gl.getUniformLocation(sp, "uPMatrix");
    sp.mvMatrixUniform = gl.getUniformLocation(sp, "uMVMatrix");
    sp.samplerUniform = gl.getUniformLocation(sp, "uSampler");

    return sp;
}


function initShaders() 
{
    var fragmentShader = getShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);
    var vertexShader = getShader(gl, vertexShaderSource, gl.VERTEX_SHADER);

    shaderProgram = initShader(fragmentShader, vertexShader);

    var fragmentShader1 = getShader(gl, fragmentShaderSource1, gl.FRAGMENT_SHADER);
    shaderProgram1 = initShader(fragmentShader1, vertexShader);
}


function handleLoadedTexture(texture) 
{
    gl.bindTexture(gl.TEXTURE_2D, texture);
    //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

var backgroundTex;

function initTexture() 
{
    var canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;

    var ctx = canvas.getContext('2d');
    ctx.createImageData(canvas.width, canvas.height);
    ctx.fillRect(0,0,canvas.width, canvas.height);

    randomStripes(canvas, "colorcube", 16);
    subVertical(canvas, 128);
    smoothBox(canvas, 4);   

    backgroundTex = gl.createTexture();
    backgroundTex.image = ctx.getImageData(0, 0, canvas.width, canvas.height);
/*
    var stride = 4;
    var colors = [[255,0,0,255], [0,0,0,255]];
    var c = 0;

    for (var i = 0; i < canvas.height; i++)
    {
       if (i % stride == 0) c = (c+1) % 2;
       for (var j = 0; j < canvas.width; j++)
       {
          idx = (i*canvas.width + j)*4
          backgroundTex.image.data[idx+0] = colors[c][0];
          backgroundTex.image.data[idx+1] = colors[c][1];
          backgroundTex.image.data[idx+2] = colors[c][2];
          backgroundTex.image.data[idx+3] = colors[c][3];
       }
    }
    */
    handleLoadedTexture(backgroundTex);
}

function initTextureFromFile(filename)
{
   backgroundTex = gl.createTexture();
   backgroundTex.image = new Image();
   backgroundTex.image.onload = function () 
   {
       handleLoadedTexture(backgroundTex)
   }
   backgroundTex.image.src = filename;   
}

var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();

function mvPushMatrix() 
{
    var copy = mat4.create();
    mat4.set(mvMatrix, copy);
    mvMatrixStack.push(copy);
}

function mvPopMatrix() 
{
    if (mvMatrixStack.length == 0) {
        throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

var currentlyPressedKeys = {};
function handleKeyDown(event) 
{
   currentlyPressedKeys[event.keyCode] = true;
}

function handleKeyUp(event) 
{
   currentlyPressedKeys[event.keyCode] = false;
}


var x_pos = 0;
var y_pos = 0;
function handleKeys() 
{
   /*if (currentlyPressedKeys[33]) 
   {
       // Page Up
       z -= 0.05;
   }
   if (currentlyPressedKeys[34]) 
   {
      // Page Down
      z += 0.05;
   }
   */
   if (currentlyPressedKeys[37]) 
   {
      // Left cursor key
      x_pos -= 0.1;
   }
   if (currentlyPressedKeys[39]) 
   {
      // Right cursor key
      x_pos += 0.1;
   }
   if (currentlyPressedKeys[38]) 
   {
      // Up cursor key
      y_pos += 0.1;
   }
   if (currentlyPressedKeys[40]) 
   {
      // Down cursor key
      y_pos -= 0.1;
   }

   if (currentlyPressedKeys[65])
   {
      invert = true;
   }
   if (currentlyPressedKeys[90])
   {
      invert = false;
   }
}

function degToRad(degrees) 
{
    return degrees * Math.PI / 180;
}

var triVertexPositionBuffer;
var triVertexTextureCoordBuffer;

var sqrVertexPositionBuffer;
var sqrVertexTextureCoordBuffer;

function initBuffers() 
{
    triVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triVertexPositionBuffer);
    var vertices = [
         0.0,  5.0,  0.0,
        -5.0, -5.0,  0.0,
         5.0, -5.0,  0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    triVertexPositionBuffer.itemSize = 3;
    triVertexPositionBuffer.numItems = 3;

    triVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triVertexTextureCoordBuffer);
    var textureCoords = [      
      (vertices[0]+10)/20.0,  (vertices[1]+10)/20.0,
      (vertices[3]+10)/20.0,  (vertices[4]+10)/20.0,
      (vertices[6]+10)/20.0,  (vertices[7]+10)/20.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    triVertexTextureCoordBuffer.itemSize = 2;
    triVertexTextureCoordBuffer.numItems = 3;

    //--
    sqrVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sqrVertexPositionBuffer);
    vertices = [
         10.0,  10.0,  0.0,
        -10.0,  10.0,  0.0,
         10.0, -10.0,  0.0,
        -10.0, -10.0,  0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    sqrVertexPositionBuffer.itemSize = 3;
    sqrVertexPositionBuffer.numItems = 4;

    sqrVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sqrVertexTextureCoordBuffer);
    var textureCoords = [      
      1.0, 1.0,
      0.0, 1.0,
      1.0, 0.0,
      0.0, 0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    sqrVertexTextureCoordBuffer.itemSize = 2;
    sqrVertexTextureCoordBuffer.numItems = 4;
}

function drawTriangle()
{
    mvPushMatrix();

    mat4.translate(mvMatrix, [0, 0, -8.0]);
    //mat4.rotate(mvMatrix, degToRad(xRot), [1, 0, 0]);
    //mat4.rotate(mvMatrix, degToRad(yRot), [0, 1, 0]);
    //mat4.rotate(mvMatrix, degToRad(zRot), [0, 0, 1]);

    var activeShader = shaderProgram;
    if (invert)
    {
       activeShader = shaderProgram1;
       gl.useProgram(shaderProgram1);
    }
    else
    {
       gl.useProgram(shaderProgram);
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, triVertexPositionBuffer);
    gl.vertexAttribPointer(activeShader.vertexPositionAttribute, triVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, triVertexTextureCoordBuffer);
    gl.vertexAttribPointer(activeShader.textureCoordAttribute, triVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, backgroundTex);
    gl.uniform1i(activeShader.samplerUniform, 0);


    if (invert)
    {    
        gl.uniformMatrix4fv(shaderProgram1.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgram1.mvMatrixUniform, false, mvMatrix);
    }
    else
    {
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
    }
    gl.drawArrays(gl.TRIANGLES, 0, triVertexPositionBuffer.numItems);
    mvPopMatrix();   
}

function drawSquare()
{
    gl.useProgram(shaderProgram);
    mvPushMatrix();

    mat4.translate(mvMatrix, [0.0, 0.0, -10.0]);
    //mat4.rotate(mvMatrix, degToRad(xRot), [1, 0, 0]);
    //mat4.rotate(mvMatrix, degToRad(yRot), [0, 1, 0]);
    //mat4.rotate(mvMatrix, degToRad(-zRot), [0, 0, 1]);

    gl.bindBuffer(gl.ARRAY_BUFFER, sqrVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, sqrVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, sqrVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, sqrVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, backgroundTex);
    gl.uniform1i(shaderProgram.samplerUniform, 0);

    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, sqrVertexPositionBuffer.numItems);
    mvPopMatrix();     
}

function drawPlayer()
{
    gl.useProgram(shaderProgram);
    mvPushMatrix();

    mat4.translate(mvMatrix, [x_pos, y_pos, 0.0]);
    mat4.scale(mvMatrix, [0.1,0.1,0.1]);
    //mat4.rotate(mvMatrix, degToRad(xRot), [1, 0, 0]);
    //mat4.rotate(mvMatrix, degToRad(yRot), [0, 1, 0]);
    //mat4.rotate(mvMatrix, degToRad(-zRot), [0, 0, 1]);

    gl.bindBuffer(gl.ARRAY_BUFFER, sqrVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, sqrVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, sqrVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, sqrVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, backgroundTex);
    gl.uniform1i(shaderProgram.samplerUniform, 0);

    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, sqrVertexPositionBuffer.numItems);
    mvPopMatrix();     
   
}

var xRot = 0;
var yRot = 0;
var zRot = 0;

function drawScene() 
{
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
    mat4.ortho(-10, 10, -10, 10, 0.1, 100, pMatrix);
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, [0, 0, -14.0]);
    //mat4.rotate(mvMatrix, angle, [1, 0, 0]);

    drawTriangle();
    drawSquare();
    drawPlayer();
}


var lastTime = 0;
function animate() 
{
    var timeNow = new Date().getTime();
    if (lastTime != 0) 
    {
        var elapsed = timeNow - lastTime;

        xRot += (90 * elapsed) / 1000.0;
        yRot += (90 * elapsed) / 1000.0;
        zRot += (90 * elapsed) / 1000.0;
    }
    lastTime = timeNow;
}

function tick() 
{
    requestAnimFrame(tick);
    handleKeys();
    drawScene();
    animate();
}

function webGLStart() 
{
    var canvas = document.getElementById("game-canvas");
    initGL(canvas);
    initShaders();
    initBuffers();
    initTexture();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;

    tick();
}

