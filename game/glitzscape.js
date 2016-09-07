// constants
const DEG2RAD = Math.PI / 180.0;

// webGL state and helpers
var gl;
var shaderBackground;
var shaderForeground;
var backgroundTex;
var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();

// player geometry
var triSize = 0.25;
var triColorBuffer;
var triVertexPositionBuffer;
var triVertexTextureCoordBuffer;

// background geometry
var sqrSize = 10.0;
var sqrColorBuffer;
var sqrVertexPositionBuffer;
var sqrVertexTextureCoordBuffer;

// hex geometry
var hexColorBuffer;
var hexVertexPositionBuffer;
var hexVertexTextureCoordBuffer;

// game state
var lastTime = 0;
var player = new Player();
var hexBoard = new HexBoard(1.0, sqrSize, 0.05);

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

    sp.colorAttribute = gl.getAttribLocation(sp, "aColor");
    gl.enableVertexAttribArray(sp.colorAttribute);    

    sp.pMatrixUniform = gl.getUniformLocation(sp, "uPMatrix");
    sp.mvMatrixUniform = gl.getUniformLocation(sp, "uMVMatrix");
    sp.samplerUniform = gl.getUniformLocation(sp, "uSampler");
    sp.alphaUniform = gl.getUniformLocation(sp, "uAlpha");

    return sp;
}

function initShaders() 
{
    var fragmentBackground = getShader(gl, fragmentShaderSource_SimpleBlend, gl.FRAGMENT_SHADER);
    var vertexShader = getShader(gl, vertexShaderSource, gl.VERTEX_SHADER);

    shaderBackground = initShader(fragmentBackground, vertexShader);
    console.log("Initialized vertexShaderSource, fragmentShaderSource_SimpleBlend");

    var fragmentForeground = getShader(gl, fragmentShaderSource_ForegroundBlend, gl.FRAGMENT_SHADER);
    shaderForeground = initShader(fragmentForeground, vertexShader);
    console.log("Initialized vertexShaderSource, fragmentShaderSource_ForegroundBlend");
}

function handleLoadedTexture(texture) 
{
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

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

function mvPushMatrix() 
{
    var copy = mat4.create();
    mat4.set(mvMatrix, copy);
    mvMatrixStack.push(copy);
}

function mvPopMatrix() 
{
    if (mvMatrixStack.length == 0) 
    {
        throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

function handleKeyDown(event) 
{
}

function handleKeyUp(event) 
{
}

/*
function handleKeyUp(event) 
{
   var result = null;
   if (event.keyCode === 81) //q
   {
      result = goNW(idxCurr);
   }
   if (event.keyCode === 87) //w
   {
      result = goN(idxCurr);    
   }
   if (event.keyCode === 69) //e
   {
      result = goNE(idxCurr);     
   }
   if (event.keyCode === 65) //a
   {
      result = goSW(idxCurr);     
   }
   if (event.keyCode === 83) //s
   {
      result = goS(idxCurr);  
   }
   if (event.keyCode === 68) //d
   {
      result = goSE(idxCurr);    
   }

   if (result)
   {
      idxNext = result.idx;
      if (idxNext !== -1)
      {
         queueDir(result.dir);
      }
      else
      {
         clearDir();
      }        
   }
}*/

function distanceSqr(a, b)
{
   var d = (a.x - b.x)*(a.x - b.x) + (a.y - b.y)*(a.y - b.y);
   return d;
}

function initBuffers() 
{
    //-- background quad
    var sVertices = [
         sqrSize,  sqrSize,  0.0,
        -sqrSize,  sqrSize,  0.0,
         sqrSize, -sqrSize,  0.0,
        -sqrSize, -sqrSize,  0.0
    ];
    var sColors = [
         1.0, 1.0, 1.0,
         1.0, 1.0, 1.0,
         1.0, 1.0, 1.0,
         1.0, 1.0, 1.0
    ];
    var textureCoords = [      
      1.0, 1.0, 1.0,
      0.0, 1.0, 1.0,
      1.0, 0.0, 1.0,
      0.0, 0.0, 1.0
    ];

    sqrVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sqrVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sVertices), gl.STATIC_DRAW);
    sqrVertexPositionBuffer.itemSize = 3;
    sqrVertexPositionBuffer.numItems = 4;

    sqrColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sqrColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sColors), gl.STATIC_DRAW);
    sqrColorBuffer.itemSize = 3;
    sqrColorBuffer.numItems = 4;
    
    sqrVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sqrVertexTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    sqrVertexTextureCoordBuffer.itemSize = 3;
    sqrVertexTextureCoordBuffer.numItems = 4;

    //----    
    var tVertices = [
         0.0,      triSize,  0.0,
        -triSize, -triSize,  0.0,
         triSize, -triSize,  0.0
    ];
    var sColors = [
         0.0, 1.0, 1.0,
         0.0, 1.0, 1.0,
         0.0, 1.0, 1.0
    ];
    var textureCoords = [      
      (tVertices[0]+10)/20.0,  (tVertices[1]+10)/20.0, 1.0,
      (tVertices[3]+10)/20.0,  (tVertices[4]+10)/20.0, 1.0,
      (tVertices[6]+10)/20.0,  (tVertices[7]+10)/20.0, 1.0
    ];

    triVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tVertices), gl.STATIC_DRAW);
    triVertexPositionBuffer.itemSize = 3;
    triVertexPositionBuffer.numItems = 3;

    triColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sColors), gl.STATIC_DRAW);
    triColorBuffer.itemSize = 3;
    triColorBuffer.numItems = 3;    

    triVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triVertexTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    triVertexTextureCoordBuffer.itemSize = 3;
    triVertexTextureCoordBuffer.numItems = 3;

    //--
    hexBoard.initBoard();

    hexVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, hexVertexPositionBuffer);    
    gl.bufferData(gl.ARRAY_BUFFER, hexBoard.vertices, gl.STATIC_DRAW);
    hexVertexPositionBuffer.itemSize = 3;
    hexVertexPositionBuffer.numItems = hexBoard.vertices.length/3;

    hexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, hexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, hexBoard.colors, gl.STATIC_DRAW);
    hexColorBuffer.itemSize = 3;
    hexColorBuffer.numItems = hexBoard.colors.length/3;  

    hexVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, hexVertexTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, hexBoard.uvs, gl.DYNAMIC_DRAW);
    hexVertexTextureCoordBuffer.itemSize = 3;
    hexVertexTextureCoordBuffer.numItems = hexBoard.uvs.length/2;    
}

function drawTriangle()
{  
    mvPushMatrix();

    mat4.translate(mvMatrix, [player.pos.x, player.pos.y, 0.0]);
    mat4.rotate(mvMatrix, player.rot * DEG2RAD, [0, 0, 1]);

    gl.useProgram(shaderForeground);
    gl.bindBuffer(gl.ARRAY_BUFFER, triVertexPositionBuffer);
    gl.vertexAttribPointer(shaderForeground.vertexPositionAttribute, triVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, triVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderForeground.textureCoordAttribute, triVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, triColorBuffer);
    gl.vertexAttribPointer(shaderForeground.colorAttribute, triColorBuffer.itemSize, gl.FLOAT, false, 0, 0);    

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, backgroundTex);
    gl.uniform1i(shaderForeground.samplerUniform, 0);

    gl.uniformMatrix4fv(shaderForeground.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderForeground.mvMatrixUniform, false, mvMatrix);
    gl.drawArrays(gl.TRIANGLES, 0, triVertexPositionBuffer.numItems);
    mvPopMatrix();   
}

function drawHexBoard()
{  
    mvPushMatrix();

    mat4.translate(mvMatrix, [0, 0, -8.0]);

    gl.useProgram(shaderForeground);
    gl.bindBuffer(gl.ARRAY_BUFFER, hexVertexPositionBuffer);
    gl.vertexAttribPointer(shaderForeground.vertexPositionAttribute, hexVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, hexVertexTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, hexBoard.uvs, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(shaderForeground.textureCoordAttribute, hexVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, hexColorBuffer);
    gl.vertexAttribPointer(shaderForeground.colorAttribute, hexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, backgroundTex);
    gl.uniform1i(shaderForeground.samplerUniform, 0);

    gl.uniformMatrix4fv(shaderForeground.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderForeground.mvMatrixUniform, false, mvMatrix);
    gl.drawArrays(gl.TRIANGLES, 0, hexVertexPositionBuffer.numItems);
    mvPopMatrix();   
}

function drawBackground()
{
    mvPushMatrix();

    mat4.translate(mvMatrix, [0.0, 0.0, -10.0]);

    gl.useProgram(shaderBackground);
    gl.bindBuffer(gl.ARRAY_BUFFER, sqrVertexPositionBuffer);
    gl.vertexAttribPointer(shaderBackground.vertexPositionAttribute, sqrVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, sqrVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderBackground.textureCoordAttribute, sqrVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, sqrColorBuffer);
    gl.vertexAttribPointer(shaderForeground.colorAttribute, sqrColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, backgroundTex);
    gl.uniform1i(shaderBackground.samplerUniform, 0);
    gl.uniform1f(shaderBackground.alphaUniform, 1.0);

    gl.uniformMatrix4fv(shaderBackground.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderBackground.mvMatrixUniform, false, mvMatrix);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, sqrVertexPositionBuffer.numItems);
    mvPopMatrix();     
}

function drawScene() 
{
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.ortho(-10, 10, -10, 10, 0.1, 100, pMatrix);
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, [0, 0, -14.0]);

    drawBackground();
    drawHexBoard();
    drawTriangle();
}

function animate() 
{
    var timeNow = new Date().getTime();
    if (lastTime != 0) 
    {
        var elapsed = timeNow - lastTime;
        // todo:updatePlayer(elapsed);
    }
    lastTime = timeNow;
}

function tick() 
{
    requestAnimFrame(tick);
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

    var idx = Math.floor(Math.random() * hexBoard.numHex);
    player.placeInHex(idx);

    //var p1 = hexCenterById(idx);
    //var idx2 = pointToHexId(p1);
    //var p2 = hexCenterById(idx2);
    //console.log("TEST "+idx+" "+p1+" "+idx2+" "+p2);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.enable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);    

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;

    tick();
}

