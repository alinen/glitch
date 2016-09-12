// constants
const DEG2RAD = Math.PI / 180.0;

var GEOMETRY = 
{
   QUAD: 0,
   TRI: 1,
   HEX: 2,
   HEX_LINE: 3
};

// webGL state and helpers
var gl;

var shaderTex;
var shaderTexInvert;
var shaderSolid;
var backgroundTex;
var orbTex;
var starTex;
var cubeTex;
var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();
var geometry = [];
var objects = [];

// game state
var worldSize = 10.0;
var lastTime = 0;
var player = new Player();
var hexBoard = new HexBoard(1.0, worldSize, 0.1);
var left = -worldSize;
var right = worldSize;
var bottom = -worldSize;
var up = worldSize;

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

    return sp;
}

function initShaders() 
{
    var fragmentBackground = getShader(gl, fragmentShaderSource_Tex, gl.FRAGMENT_SHADER);
    var vertexShader = getShader(gl, vertexShaderSource, gl.VERTEX_SHADER);

    shaderTex = initShader(fragmentBackground, vertexShader);
    console.log("Initialized vertexShaderSource, fragmentShaderSource_Tex");

    var fragmentForeground = getShader(gl, fragmentShaderSource_TexInvert, gl.FRAGMENT_SHADER);
    shaderTexInvert = initShader(fragmentForeground, vertexShader);
    console.log("Initialized vertexShaderSource, fragmentShaderSource_TexInvert");

    var fragmentSolid = getShader(gl, fragmentShaderSource_Solid, gl.FRAGMENT_SHADER);
    shaderSolid = initShader(fragmentSolid, vertexShader);
    console.log("Initialized vertexShaderSource, fragmentShaderSource_Solid");    
}

function handleLoadedTexture(texture, mipmaps) 
{
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); 
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (mipmaps)
    {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
      gl.generateMipmap(gl.TEXTURE_2D);
    }
    else
    {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    }
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

    handleLoadedTexture(backgroundTex, false);
}

function initTextureFromFile(filename)
{
   var tex = gl.createTexture();
   tex.image = new Image();
   tex.image.onload = function () 
   {
       handleLoadedTexture(tex, true);
   }
   tex.image.src = filename;   
   return tex;
}

function loadTextures()
{
   initTexture();
   orbTex = initTextureFromFile("orb.png");
   starTex = initTextureFromFile("spawn.png");
   cubeTex = initTextureFromFile("heart.png");
} 

function mvPushMatrix() 
{
    var copy = mat4.create();
    mat4.set(mvMatrix, copy);
    mvMatrixStack.push(copy);
}

function mvPopMatrix() 
{
    if (mvMatrixStack.length === 0) 
    {
        throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

function handleKeyDown(event) 
{
    var move = null;
    if (event.keyCode === 81) //q
    {
       move = NEIGHBOR.NW;
    }
    if (event.keyCode === 87) //w
    {
       move = NEIGHBOR.N;
    }
    if (event.keyCode === 69) //e
    {
       move = NEIGHBOR.NE;
    }
    if (event.keyCode === 65) //a
    {
       move = NEIGHBOR.SW;
    }
    if (event.keyCode === 83) //s
    {
       move = NEIGHBOR.S;
    }
    if (event.keyCode === 68) //d
    {
       move = NEIGHBOR.SE;
    }
   
    if (move) player.attemptMove(move);
}

function createGlBuffer(values, itemSize, numItems, type)
{
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, values, type);
    buffer.itemSize = itemSize;
    buffer.numItems = numItems;
    return buffer;
}

function initBuffers() 
{
    //-- background quad
    var sVertices = [
         1,  1, 0,
        -1,  1, 0,
         1, -1, 0,
        -1, -1, 0
    ];
    var sColors = [
         1.0, 1.0, 1.0, 1.0,
         1.0, 1.0, 1.0, 1.0,
         1.0, 1.0, 1.0, 1.0,
         1.0, 1.0, 1.0, 1.0
    ];
    var sTexs = [      
         1.0, 1.0,
         0.0, 1.0, 
         1.0, 0.0, 
         0.0, 0.0
    ];
    
    geometry.push(
    {
       vertexBuffer :  createGlBuffer(new Float32Array(sVertices), 3, 4, gl.STATIC_DRAW),
       colorBuffer :   createGlBuffer(new Float32Array(sColors), 4, 4, gl.STATIC_DRAW),
       textureBuffer : createGlBuffer(new Float32Array(sTexs), 2, 4, gl.STATIC_DRAW),
       vertexDynamic : null,
       colorDynamic : null,
       textureDynamic : null,
       primitive : gl.TRIANGLE_STRIP
    });

    //-- 

    //----    
    var tVertices = [
         0,  1,  0.0,
        -1, -1,  0.0,
         1, -1,  0.0
    ];
    var tColors = [
         0.0, 0.0, 1.0, 1.0,
         0.0, 0.0, 1.0, 1.0,
         0.0, 0.0, 1.0, 1.0
    ];
    var tTexs = [      
        0.5, 1,
        0,   0,
        1,   0
    ];

    geometry.push(
    {
       vertexBuffer : createGlBuffer(new Float32Array(tVertices), 3, 3, gl.STATIC_DRAW),
       colorBuffer : createGlBuffer(new Float32Array(tColors), 4, 3, gl.STATIC_DRAW),
       textureBuffer : createGlBuffer(new Float32Array(tTexs), 2, 3, gl.STATIC_DRAW),
       vertexDynamic : null,
       colorDynamic : null,
       textureDynamic : null,
       primitive : gl.TRIANGLES
    });

    //--
    hexBoard.initBoard();
    hexBoard.computeMaze();
    left = -worldSize+hexBoard.bRes;
    right = -worldSize+hexBoard.hexWidth;
    bottom =  -worldSize + hexBoard.r; 
    up =  worldSize;

    geometry.push(
    {
       vertexBuffer :  createGlBuffer(hexBoard.vertices, 3, hexBoard.vertices.length/3, gl.STATIC_DRAW),
       colorBuffer :   createGlBuffer(hexBoard.colors, 4, hexBoard.colors.length/4, gl.DYNAMIC_DRAW),
       textureBuffer : createGlBuffer(hexBoard.uvs, 2, hexBoard.uvs.length/2, gl.STATIC_DRAW),
       vertexDynamic : null,
       colorDynamic : hexBoard.colors,
       textureDynamic : null,
       primitive : gl.TRIANGLES
    });    

    geometry.push(
    {
       vertexBuffer :  createGlBuffer(hexBoard.lines, 3, hexBoard.lines.length/3, gl.STATIC_DRAW),
       colorBuffer :   createGlBuffer(hexBoard.lineColors, 4, hexBoard.lineColors.length/4, gl.DYNAMIC_DRAW),
       textureBuffer : createGlBuffer(hexBoard.lineTexs, 2, hexBoard.lineTexs.length/2, gl.STATIC_DRAW),
       vertexDynamic : null,
       colorDynamic : hexBoard.lineColors,
       textureDynamic : null,
       primitive : gl.LINES
    });
}

function initObjects(gameParams)
{
    objects.push(
    {
       geometry: GEOMETRY.QUAD,
       translate : {x:0,y:0,z:-10},
       rotate : null,
       scale : {s:worldSize},
       shader : shaderTex,
       texture: backgroundTex
    });

    objects.push(
    {    
       geometry: GEOMETRY.HEX,
       translate : hexBoard.gridPos,
       rotate : null,
       scale : null,
       shader : shaderSolid,
       texture: backgroundTex
    });

    objects.push(
    {    
       geometry: GEOMETRY.HEX_LINE,
       translate : hexBoard.linePos,
       rotate : null,
       scale : null,
       shader : shaderSolid,
       texture: backgroundTex
    });    

    objects.push(
    {
       geometry: GEOMETRY.QUAD,
       translate : {x:1,y:1,z:-5},
       rotate : null,
       scale : {s:0.5},
       shader : shaderTex,
       texture: orbTex
    });
    
    objects.push(
    {
       geometry: GEOMETRY.QUAD,
       translate : {x:2,y:2,z:-5},
       rotate : null,
       scale : {s:0.5},
       shader : shaderTex,
       texture: cubeTex
    });
    
    objects.push(
    {
       geometry: GEOMETRY.QUAD,
       translate : {x:3,y:3,z:-5},
       rotate : null,
       scale : {s:1.0},
       shader : shaderTex,
       texture: starTex
    });
    
    objects.push(
    {    
       geometry: GEOMETRY.TRI,
       translate : player.translate,
       rotate : player.rot,
       scale : player.scale,
       shader : shaderSolid,
       texture: backgroundTex    
    });

}

function drawScene() 
{
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    mat4.ortho(left, right, bottom, up, 0.1, 100, pMatrix);
    mat4.identity(mvMatrix);

    objects.forEach(function(obj) 
    {
       mvPushMatrix();
      
       if (obj.translate) mat4.translate(mvMatrix, [obj.translate.x, obj.translate.y, obj.translate.z]);
       if (obj.rotate) mat4.rotate(mvMatrix, obj.rotate.r * DEG2RAD, [0, 0, 1]);
       if (obj.scale) mat4.scale(mvMatrix, [obj.scale.s, obj.scale.s, obj.scale.s]);

       var g = geometry[obj.geometry];

       gl.useProgram(obj.shader);
       gl.bindBuffer(gl.ARRAY_BUFFER, g.vertexBuffer);
       if (g.vertexDynamic) gl.bufferData(gl.ARRAY_BUFFER, g.vertexDynamic, gl.DYNAMIC_DRAW);
       gl.vertexAttribPointer(obj.shader.vertexPositionAttribute, g.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

       gl.bindBuffer(gl.ARRAY_BUFFER, g.textureBuffer);
       if (g.textureDynamic) gl.bufferData(gl.ARRAY_BUFFER, g.textureDynamic, gl.DYNAMIC_DRAW);
       gl.vertexAttribPointer(obj.shader.textureCoordAttribute, g.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);

       gl.bindBuffer(gl.ARRAY_BUFFER, g.colorBuffer);
       if (g.colorDynamic) gl.bufferData(gl.ARRAY_BUFFER, g.colorDynamic, gl.DYNAMIC_DRAW);
       gl.vertexAttribPointer(obj.shader.colorAttribute, g.colorBuffer.itemSize, gl.FLOAT, false, 0, 0);    

       gl.activeTexture(gl.TEXTURE0);
       gl.bindTexture(gl.TEXTURE_2D, obj.texture);
       gl.uniform1i(obj.shader.samplerUniform, 0);

       gl.uniformMatrix4fv(obj.shader.pMatrixUniform, false, pMatrix);
       gl.uniformMatrix4fv(obj.shader.mvMatrixUniform, false, mvMatrix);
       
       gl.drawArrays(g.primitive, 0, g.vertexBuffer.numItems);
       mvPopMatrix();
    });
}

function animate() 
{
    var timeNow = new Date().getTime();
    if (lastTime != 0) 
    {
        var elapsed = timeNow - lastTime;
        player.update(elapsed);
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
    loadTextures();
    initObjects(null);

    var idx = Math.floor(Math.random() * hexBoard.numHex);
    player.placeInHex(idx);

    //var p1 = hexCenterById(idx);
    //var idx2 = pointToHexId(p1);
    //var p2 = hexCenterById(idx2);
    //console.log("TEST "+idx+" "+p1+" "+idx2+" "+p2);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE); //gl.ONE_MINUS_SRC_ALPHA); // 
    gl.enable(gl.BLEND);   
    gl.enable(gl.DEPTH_TEST);   

    document.onkeydown = handleKeyDown;

    tick();
}

