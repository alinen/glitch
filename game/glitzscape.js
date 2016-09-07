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

var hexSize = 2.0; // b
var hexR = 0.0; // r
var hexSizeResidual = 0.0; // b_prime
var hexTextureCoords;
var hexVertexCoords;
var hexColorBuffer;
var hexVertexPositionBuffer;
var hexVertexTextureCoordBuffer;

var numHex = 0;
var numRows = 0;
var numCols = 0;
var numHexPts = 0;

// player pos
var speed = 0.005;
var zRot = 0;
var xPos = 0;
var xDir = 0;
var yDir = 0;
var xNextDir = 0;
var yNextDir = 0;
var idxCurr = 0;
var idxNext = 0;
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
}

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
}

function attemptMove(idxCurrent, dir)
{
   if (dir[0] < 0 && dir[1] > 0) //q
   {
      return goNW(idxCurrent);
   }
   else if (dir[0] === 0 && dir[1] === 1) //w
   {
      return goN(idxCurrent);     
   }
   else if (dir[0] > 0 && dir[1] > 0) //e
   {
      return goNE(idxCurrent);
   }
   else if (dir[0] < 0 && dir[1] < 0) //a
   {
      return goSW(idxCurrent);      
   }
   else if (dir[0] === 0 && dir[1] === -1) //s
   {
      return goS(idxCurrent);     
   }
   else if (dir[0] > 0 && dir[1] < 0) //d
   {
      return goSE(idxCurrent);  
   }

   return {idx : -1, dir : [0,0]};
}

function goNW(idxCurrent)
{
   var cell = hexIdToCell(idxCurr);
   var nextCell = [cell[0]+1, cell[1]-1];
   if (isValid(nextCell))
   {
      return { idx: hexCellToId(nextCell), dir : [-0.866, 0.5]};
   }
   return {idx: -1, dir : [0,0]};
}

function goN(idxCurrent)
{
   var cell = hexIdToCell(idxCurr);
   var nextCell = [cell[0]+2, cell[1]];
   if (isValid(nextCell))
   {
      return { idx: hexCellToId(nextCell), dir : [0,1]};
   }   
   return {idx: -1, dir : [0,0]};
}

function goNE(idxCurrent)
{
   var cell = hexIdToCell(idxCurr);
   var nextCell = [cell[0]+1, cell[1]+1];
   if (isValid(nextCell))
   {
      return {idx : hexCellToId(nextCell), dir : [0.866, 0.5] };
   }   
   return {idx: -1, dir : [0,0]};
}

function goSW(idxCurrent)
{
   var cell = hexIdToCell(idxCurr);
   var nextCell = [cell[0]-1, cell[1]-1];
   if (isValid(nextCell))
   {
      return {idx : hexCellToId(nextCell), dir : [-0.866, -0.5] };
   }   
   return {idx: -1, dir : [0,0]};
}

function goS(idxCurrent)
{
   var cell = hexIdToCell(idxCurr);
   var nextCell = [cell[0]-2, cell[1]];
   if (isValid(nextCell))
   {
      return { idx: hexCellToId(nextCell), dir : [0, -1] };
   }   
   return {idx: -1, dir : [0,0]};
}

function goSE(idxCurrent)
{
   var cell = hexIdToCell(idxCurr);
   var nextCell = [cell[0]-1, cell[1]+1];
   if (isValid(nextCell))
   {
      return {idx : hexCellToId(nextCell), dir : [0.866, -0.5] };
   }   
   return {idx: -1, dir : [0,0]};
}

function distanceSqr(x1, y1, x2, y2)
{
   var d = (x1 - x2)*(x1 - x2) + (y1 - y2)*(y1 - y2);
   return d;
}

function updatePlayer(dt)
{
   xPos += dt * xDir * speed;
   yPos += dt * yDir * speed;

   if (idxNext > -1)
   {
      var target = hexCenterById(idxNext);
      if (distanceSqr(target[0], target[1], xPos, yPos) < 0.01)
      {
         setHexAlphaById(idxNext, 1.0);

         xDir = xNextDir;
         yDir = yNextDir;
         idxCurr = idxNext;
         xPos = target[0];
         yPos = target[1];

         var nextMove = attemptMove(idxCurr, [xDir, yDir]);
         idxNext = nextMove.idx;
         if (idxNext !== -1)
         {
            queueDir(nextMove.dir);
         }
         else
         {
            clearDir();
         }
      }
   }

   if (Math.abs(yDir) > 0.0 || Math.abs(xDir) > 0.0)
   {
      zRot = Math.atan2(-xDir, yDir) / Deg2Rad;
   }
}

function placePlayerInCell(idx)
{
   var point = hexCenterById(idx);
   xPos = point[0];
   yPos = point[1];
   setHexAlphaById(idx, 0.95);
   console.log("place player: "+xPos+" " +yPos+" id: "+idx);

   xDir = 0;
   yDir = 0;
   idxCurr = idx;

   xNextDir = 0;
   yNextDir = 0;
   idxNext = -1;
}

function isValid(idx)
{
   var cell = hexIdToCell(idx);
   return isValid(cell);
}

function isValid(cell)
{
   // todo: check against generated graph
   console.log("IS VALID "+cell+ " " + numRows + " " + numCols);
   if (cell[0] < 0) return false;
   if (cell[1] < 0) return false;

   if (cell[0] >= numRows) return false;
   if (cell[1] >= numCols*2) return false;

   if (cell[0] % 2 === 0 && cell[1] % 2 === 0) return false;
   if (cell[0] % 2 === 1 && cell[1] % 2 === 1) return false;

   return true;
}

function queueDir(dir)
{
   if (xDir === 0 && yDir === 0)
   {
      xDir = dir[0];
      yDir = dir[1];
      xNextDir = 0;
      yNextDir = 0;      
   }
   else
   {
      xNextDir = dir[0];
      yNextDir = dir[1];
   }
}

function clearDir()
{
   xDir = 0;
   yDir = 0;
   xNextDir = 0;
   yNextDir = 0;      
}

function hexPointToId(p)
{   
   var xoffset = -sqrSize + hexSizeResidual * 0.5;
   var yoffset = -sqrSize + hexR * 0.5;
   var x = p[0] - xoffset;
   var y = p[1] - yoffset;
   var row = Math.floor(y / hexR);
   var col = Math.floor(x / (2 * (hexSize - 0.5*hexSizeResidual)));

   var i = row;
   var j = 0;
   if (i % 2 == 0)
   {
      j = (j-1)/2.0;
   }
   else
   {
      j = j/2.0;
   }

   console.log("pointToHexId: "+xoffset+" "+yoffset+" "+x+" "+y+" "+row+" "+col+" "+i+" "+j);
    
   var idx = i * numCols + j;
   return idx;
}

function hexPointToCell(p)
{
   var idx = pointToHexId(p);
   return hexIdToCell(idx);
}

function hexIdToCell(idx)
{
   var row = Math.floor(idx/numCols);
   var tmp = idx - row * numCols;
   
   var i = 0;
   var j = 0;
   if (row % 2 == 0)
   {
      i = row;
      j = tmp*2+1;
   }
   else
   {
      i = row;
      j = tmp*2;
   }

   return [i,j];
}

function hexCellToId(cell)
{
   var idx = 0;
   if (cell[0] % 2 == 0)
   {
      idx = cell[0] * numCols + (cell[1]-1)/2;
   }
   else
   {
      idx = cell[0] * numCols + cell[1]/2;
   }
   return idx;
}

function hexCenterById(idx)
{
   var offset = idx * numHexPts;
   x =  hexVertexCoords[offset+0+0]; // => 0 is first vertex, 0 is x'th element
   y =  hexVertexCoords[offset+0+1]; // => 0 is first vertex, 1 is y'th element
   return [x,y,0];
}

function setHexAlphaById(idx, alpha)
{
   var offset = idx * numHexPts;
   for (var i = 0; i < numHexPts; i += 3)
   {
      hexTextureCoords[offset+i+2] = alpha;
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
   hexSizeResidual = offset;

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
            texCoords.push(0.5); // 3rd component is alpha

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

    hexVertexCoords = new Float32Array(vertices);
    hexVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, hexVertexPositionBuffer);    
    gl.bufferData(gl.ARRAY_BUFFER, hexVertexCoords, gl.STATIC_DRAW);
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
        updatePlayer(elapsed);
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

    var idx = Math.floor(Math.random() * numHex);
    placePlayerInCell(idx);

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

