var gl;
var shaderBackground;
var shaderForeground;
var alpha = 0.5;
var backgroundTex;
var xrot = 0;
var yrot = 0;
var zrot = 0;
var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();

var triSize = 0.5;
var triColorBuffer;
var triVertexPositionBuffer;
var triVertexTextureCoordBuffer;

var sqrSize = 10.0;
var sqrColorBuffer;
var sqrVertexPositionBuffer;
var sqrVertexTextureCoordBuffer;

var hexSize = 2.0;
var hexColorBuffer;
var hexVertexPositionBuffer;
var hexTextureCoords;
var hexVertexTextureCoordBuffer;

var numHex = 0;
var numRows = 0;
var numCols = 0;
var numHexPts = 0;

var zRot = 0;
var xPos = 0;
var yPos = 0;
var xLastPos = 0;
var yLastPos = -1;
var currentlyPressedKeys = {};
var lastTime = 0;

const Deg2Rad = Math.PI / 180.0;

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
   currentlyPressedKeys[event.keyCode] = true;
}

function handleKeyUp(event) 
{
   currentlyPressedKeys[event.keyCode] = false;
}

function updateZRot()
{
   var rise = yLastPos - yPos;
   var run = xLastPos - xPos;
   if (Math.abs(rise) > 0.0 || Math.abs(run) > 0.0)
   {
      zRot = Math.atan2(rise, run) / Deg2Rad + 90;
   }
   else
   {
      zRot = 0.0;
   }
}

function handleKeys() 
{
   /*if (currentlyPressedKeys[33]) 
   {
       // Page Up
   }
   if (currentlyPressedKeys[34]) 
   {
      // Page Down
   }
   */
   xLastPos = xPos;
   yLastPos = yPos;
   if (currentlyPressedKeys[37]) 
   {
      // Left cursor key
      xPos -= 0.1;
   }
   if (currentlyPressedKeys[39]) 
   {
      // Right cursor key
      xPos += 0.1;
   }
   if (currentlyPressedKeys[38]) 
   {
      // Up cursor key
      yPos += 0.1;
   }
   if (currentlyPressedKeys[40]) 
   {
      // Down cursor key
      yPos -= 0.1;
   }
   updateZRot();

   if (currentlyPressedKeys[65])
   {
      var idx = Math.floor(Math.random() * numHex);
      showHex(idx);
   }
   if (currentlyPressedKeys[90])
   {
      alpha -= 0.01;
      console.log(alpha);
   }
}

function showHex(idx)
{
   var offset = idx * numHexPts;
   console.log(offset + " " + numHexPts + " " + idx);
   for (var i = 0; i < numHexPts; i += 3)
   {
      hexTextureCoords[offset+i+2] = 0.5;
   } 
}

function initBoard(shape, vertices, texCoords, colors)
{
   var r = hexSize / (2 * Math.tan(30 * Deg2Rad));
   var offset = Math.sqrt(hexSize * hexSize - r * r);
   var margin = 0.9;

   numHex = 0;
   numRows = 2*(Math.floor(sqrSize/r));
   numCols = Math.floor((2*(sqrSize - hexSize)/(hexSize*3))+0.5);
   numHexPts = shape.length;
   hexR = r;
   xPos = -sqrSize + hexSize;
   yPos = -sqrSize + 2*r;

   console.log(numRows + " " + numCols + " " + r);
   var startx = -sqrSize;
   var y = -sqrSize+r;
   for (var i = 0; i < numRows; i++)
   {
      var x = startx + 2*hexSize + offset;
      var cols = numCols;
      if (i % 2 == 1)
      {
         cols = numCols;
         x = startx + hexSize;
      }

      for (var j = 0; j < cols; j++)
      {         
         for (var p = 0; p < shape.length; p+=3)
         {
            vertices.push(shape[p]*margin+x);
            vertices.push(shape[p+1]*margin+y);
            vertices.push(shape[p+2]);

            texCoords.push((shape[p]*margin+x+10)/20.0);
            texCoords.push((shape[p+1]*margin+y+10)/20.0);
            texCoords.push(0.0); // 3rd component is alpha

            colors.push(0.5);
            colors.push(0.5);
            colors.push(0.5);
         }
         numHex++;
         x += 3 * hexSize;
      }
      y += r;
   }
   console.log(vertices.length + " " + texCoords.length);
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
    var angle = 60.0 * Deg2Rad;
    var shape = [];
    for (var i = 0; i < 6; i ++)
    {
       shape.push(0.0);
       shape.push(0.0);
       shape.push(0.0);

       shape.push(hexSize * Math.cos(angle * i));
       shape.push(hexSize * Math.sin(angle * i));
       shape.push(0.0);

       shape.push(hexSize * Math.cos(angle * (i+1)));
       shape.push(hexSize * Math.sin(angle * (i+1)));
       shape.push(0.0);       
    }
    var textureCoords = [];
    var vertices = [];
    var colors = [];
    initBoard(shape, vertices, textureCoords, colors);

    hexVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, hexVertexPositionBuffer);    
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    hexVertexPositionBuffer.itemSize = 3;
    hexVertexPositionBuffer.numItems = vertices.length/3;

    hexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, hexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    hexColorBuffer.itemSize = 3;
    hexColorBuffer.numItems = colors.length/3;  

    hexTextureCoords = new Float32Array(textureCoords);
    hexVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, hexVertexTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, hexTextureCoords, gl.DYNAMIC_DRAW);
    hexVertexTextureCoordBuffer.itemSize = 3;
    hexVertexTextureCoordBuffer.numItems = textureCoords.length/2;    
}

function drawTriangle()
{  
    mvPushMatrix();

    mat4.translate(mvMatrix, [xPos, yPos, 0.0]);
    mat4.rotate(mvMatrix, zRot * Deg2Rad, [0, 0, 1]);

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
    gl.bufferData(gl.ARRAY_BUFFER, hexTextureCoords, gl.DYNAMIC_DRAW);
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
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.enable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);    

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;

    tick();
}

