// constants
const DEG2RAD = Math.PI / 180.0;
const DOUBLE_CLICK_THRESH = 0.01;

var GEOMETRY = 
{
   QUAD: 0,
   TRI: 1,
   HEX: 2,
   BLOOD: 3,
   SPAWN: 4,
   HEART: 5,
   ORB: 6,
   STAR: 7
};

// webGL state and helpers
var gl;
var shaderTex;
var shaderTexInvert;
var shaderSolid;
var shaderNoise;
var backgroundTex;
var teethTex;
var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();
var geometry = [];
var objects = [];

// game state
var lastMouseX = null;
var lastMouseY = null;
var worldSize = 10.0;
var lastTime = 0;
var player = new Player();
var hexBoard = new HexBoard(2.0, worldSize, 0.2);
var gameState = null;
var gos = []; // game objects
var left = -worldSize;
var right = worldSize;
var bottom = -worldSize;
var up = worldSize;
var time = 0;
var paused = true;
var gameOver = false;
var lowerTeeth = null;
var upperTeeth = null;
var highlightIdx = -1;
var numCaves = 0;
var maxCaves = 3; // Set number of caves to escape to win game
var currentMsg = null;
var lastClick = 0;
var queueMove = false; // to support double click

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
    sp.time = gl.getUniformLocation(sp, "uT");
    
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

    var fragmentNoise = getShader(gl, fragmentShaderSource_Noise, gl.FRAGMENT_SHADER);
    shaderNoise = initShader(fragmentNoise, vertexShader);    
}

function handleLoadedTexture(texture, mipmaps) 
{
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); 
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
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

    var cmIdx = Math.floor(Math.random() * colormapList.length);
    randomStripes(canvas, colormapList[cmIdx], 32);
    subVertical(canvas, 16);
    smoothBox(canvas, 2);   

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
   teethTex = initTextureFromFile("teeth.png");
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

function pauseGame()
{
   pause = true;
}

function handleMouseMove(event)
{
    var canvas = document.getElementById("game-canvas");
    var rect = canvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;

    var sceneX = (x * worldSize * 2.0)/canvas.width - worldSize;
    var sceneY = worldSize - (y * worldSize * 2.0)/canvas.height;
    //console.log(sceneX+" "+sceneY);

    // ASN TODO: Consider moving to hexBoard
    if (highlightIdx !== -1 && !hexBoard.isVisibleHex(highlightIdx))
    {
       hexBoard.setHexAlphaById(highlightIdx, 0, false);
    }

    var idx = hexBoard.pointToId({x:sceneX,y:sceneY});
    if (idx !== -1 && !hexBoard.isVisibleHex(idx) && hexBoard.hasVisibleNeighbor(idx) !== -1)
    {
       hexBoard.setHexAlphaById(idx, 0.5, false);       
       highlightIdx = idx;
    }

    // allow player icon to update also
    player.aim({x:sceneX, y:sceneY});

    lastMouseX = sceneX;
    lastMouseY = sceneY;
}

function handleMouseDown(event)
{
   var dblClick = false;
   var timeNow = new Date().getTime();
   var diff = (timeNow - lastClick) * 0.00005;
   console.log("mouse down "+diff);
   if (diff < DOUBLE_CLICK_THRESH)
   {
      dblClick = true;
   }
   lastClick = timeNow;

   if (paused)
   {
      paused = false;
   }
   else
   {
      if (dblClick)
      {
         player.enableFireMode(true);
         var wp = {x:lastMouseX, y:lastMouseY};
         player.fire(wp);
         queueMove = false;
      }
      else
      {
         queueMove = true;
      }
   }

   if (currentMsg)
   {
      $("#"+currentMsg).fadeOut();
      currentMsg = null;

      if (gameOver)
      {
         resetGame();
      }
   }
}

function handleKeyDown(event) 
{
   if (event.keyCode === 80) //p
   {
      paused = !paused;
   }
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
         1.0, 1.0, 1.0, 1.0,
         1.0, 1.0, 1.0, 1.0,
         1.0, 1.0, 1.0, 1.0
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
    //left = -worldSize+hexBoard.bRes;
    //right = -worldSize+hexBoard.hexWidth;
    //bottom =  -worldSize + hexBoard.r; 
    //up =  worldSize;

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

    //-- Blood/Danger
    var vertices = [
      0.0, 0.0, 0.0,  3.0, 1.0, 0.0,  1.0, 3.0, 0.0, 
      0.0, 0.0, 0.0, -1.0, 3.0, 0.0, -3.0, 1.0, 0.0, 
      0.0, 0.0, 0.0, -3.0,-1.0, 0.0, -1.0,-3.0, 0.0, 
      0.0, 0.0, 0.0,  1.0,-3.0, 0.0,  3.0,-1.0, 0.0
    ];

    var colors = [];
    var texs = [];
    for (var i = 0; i < vertices.length; i+=3)
    {
       colors.push(0.0);
       colors.push(0.0);
       colors.push(0.0);
       colors.push(1.0);

       texs.push(0.0);
       texs.push(0.0);
    }    

    geometry.push(
    {
       vertexBuffer :  createGlBuffer(new Float32Array(vertices), 3, vertices.length/3, gl.STATIC_DRAW),
       colorBuffer :   createGlBuffer(new Float32Array(colors), 4, colors.length/4, gl.STATIC_DRAW),
       textureBuffer : createGlBuffer(new Float32Array(texs), 2, texs.length/2, gl.STATIC_DRAW),
       vertexDynamic : null,
       colorDynamic : null,
       textureDynamic : null,
       primitive : gl.TRIANGLES
    });    

    //- SPAWN
    var vertices = [
      0.0, 0.0, 0.0,  2.0, 2.0, 0.0,  0.0, 2.0, 0.0, 
      0.0, 0.0, 0.0,  1.5, 0.0, 0.0,  0.5, 0.5, 0.0, 
      1.5, 0.0, 0.0,  1.5, 0.5, 0.0,  0.5, 0.5, 0.0, 
      1.5, 0.0, 0.0,  2.0, 0.0, 0.0,  2.0, 2.0, 0.0,
      1.5, 0.0, 0.0,  2.0, 2.0, 0.0,  1.5, 1.5, 0.0,

      0.0, 0.0, 0.0,  0.0, 2.0, 0.0, -2.0, 2.0, 0.0,  
      0.0, 0.0, 0.0, -0.5, 0.5, 0.0, -1.5, 0.0, 0.0,
     -1.5, 0.0, 0.0, -0.5, 0.5, 0.0, -1.5, 0.5, 0.0,
     -1.5, 0.0, 0.0, -2.0, 2.0, 0.0, -2.0, 0.0, 0.0,  
     -1.5, 0.0, 0.0, -1.5, 1.5, 0.0, -2.0, 2.0, 0.0, 

      0.0, 0.0, 0.0,  0.5,-1.0, 0.0,  1.0, 0.0, 0.0,
      1.0, 0.0, 0.0,  1.5,-1.0, 0.0,  2.0, 0.0, 0.0,

      0.0, 0.0, 0.0, -1.0, 0.0, 0.0, -0.5,-1.0, 0.0,
     -1.0, 0.0, 0.0, -2.0, 0.0, 0.0, -1.5,-1.0, 0.0
    ];

    var colors = [];
    var texs = [];
    for (var i = 0; i < vertices.length; i+=3)
    {
       colors.push(0.0);
       colors.push(0.0);
       colors.push(0.0);
       colors.push(1.0);

       texs.push(0.0);
       texs.push(0.0);
    }    

    geometry.push(
    {
       vertexBuffer :  createGlBuffer(new Float32Array(vertices), 3, vertices.length/3, gl.STATIC_DRAW),
       colorBuffer :   createGlBuffer(new Float32Array(colors), 4, colors.length/4, gl.STATIC_DRAW),
       textureBuffer : createGlBuffer(new Float32Array(texs), 2, texs.length/2, gl.STATIC_DRAW),
       vertexDynamic : null,
       colorDynamic : null,
       textureDynamic : null,
       primitive : gl.TRIANGLES
    });    

    //- HEART
    vertices = [
       0.0, 0.0, 0.0,  0.0, 0.25, 0.0,  -0.5, 1.0, 0.0, 
       0.0, 0.0, 0.0, -0.5, 1.0, 0.0,  -2.0, 1.0, 0.0, 
       0.0, 0.0, 0.0, -2.0, 1.0, 0.0,  -2.0, 0.0, 0.0, 
       0.0, 0.0, 0.0, -2.0, 0.0, 0.0,   0.0,-2.0, 0.0, 

       0.0, 0.0, 0.0,  0.0,-2.0, 0.0,   2.0, 0.0, 0.0, 
       0.0, 0.0, 0.0,  2.0, 0.0, 0.0,   2.0, 1.0, 0.0, 
       0.0, 0.0, 0.0,  2.0, 1.0, 0.0,   0.5, 1.0, 0.0, 
       0.0, 0.0, 0.0,  0.5, 1.0, 0.0,   0.0, 0.25, 0.0       
    ];

    colors = [];
    texs = [];
    for (var i = 0; i < vertices.length; i+=3)
    {
       colors.push(0.0);
       colors.push(0.0);
       colors.push(0.0);
       colors.push(1.0);

       texs.push(0.0);
       texs.push(0.0);
    }    

    geometry.push(
    {
       vertexBuffer :  createGlBuffer(new Float32Array(vertices), 3, vertices.length/3, gl.STATIC_DRAW),
       colorBuffer :   createGlBuffer(new Float32Array(colors), 4, colors.length/4, gl.STATIC_DRAW),
       textureBuffer : createGlBuffer(new Float32Array(texs), 2, texs.length/2, gl.STATIC_DRAW),
       vertexDynamic : null,
       colorDynamic : null,
       textureDynamic : null,
       primitive : gl.TRIANGLES
    });

    //- ORB
    vertices = [];
    colors = [];
    texs = [];
    var slices = 16;
    var deltaAngle = 4*Math.PI/slices;
    for (var i = 0; i < slices; i++)
    {
       var x1 = 2*Math.cos(deltaAngle*i);
       var y1 = 2*Math.sin(deltaAngle*i);

       var x2 = 2*Math.cos(deltaAngle*(i+1));
       var y2 = 2*Math.sin(deltaAngle*(i+1));

       vertices.push(0);
       vertices.push(0);
       vertices.push(0);

       vertices.push(x1);
       vertices.push(y1);
       vertices.push(0.0);

       vertices.push(x2);
       vertices.push(y2);
       vertices.push(0.0);

       colors.push(1.0);
       colors.push(1.0);
       colors.push(1.0);
       colors.push(1.0);

       colors.push(1.0);
       colors.push(1.0);
       colors.push(1.0);
       colors.push(1.0);

       colors.push(1.0);
       colors.push(1.0);
       colors.push(1.0);
       colors.push(1.0);
       
       texs.push(0.0);
       texs.push(0.0);

       texs.push(0.0);
       texs.push(0.0);
       
       texs.push(0.0);
       texs.push(0.0);
    }

    geometry.push(
    {
       vertexBuffer :  createGlBuffer(new Float32Array(vertices), 3, vertices.length/3, gl.STATIC_DRAW),
       colorBuffer :   createGlBuffer(new Float32Array(colors), 4, colors.length/4, gl.STATIC_DRAW),
       textureBuffer : createGlBuffer(new Float32Array(texs), 2, texs.length/2, gl.STATIC_DRAW),
       vertexDynamic : null,
       colorDynamic : null,
       textureDynamic : null,
       primitive : gl.TRIANGLES
    });

    //- STAR
    vertices = [
       -0.5,-0.5, 0.0,  0.5, 0.5, 0.0,  -0.5, 0.5, 0.0, 
       -0.5, 0.5, 0.0,  0.5, 0.5, 0.0,   0.0, 2.0, 0.0, 
       -0.5, 0.5, 0.0, -2.0, 0.0, 0.0,  -0.5,-0.5, 0.0, 
       -0.5,-0.5, 0.0,  0.0,-2.0, 0.0,   0.5,-0.5, 0.0, 
        0.5,-0.5, 0.0,  2.0, 0.0, 0.0,   0.5, 0.5, 0.0,
       -0.5,-0.5, 0.0,  0.5,-0.5, 0.0,   0.5, 0.5, 0.0
    ];

    colors = [];
    texs = [];
    for (var i = 0; i < vertices.length; i+=3)
    {
       colors.push(1.0);
       colors.push(1.0);
       colors.push(1.0);
       colors.push(1.0);

       texs.push(0.0);
       texs.push(0.0);
    }    

    geometry.push(
    {
       vertexBuffer :  createGlBuffer(new Float32Array(vertices), 3, vertices.length/3, gl.STATIC_DRAW),
       colorBuffer :   createGlBuffer(new Float32Array(colors), 4, colors.length/4, gl.STATIC_DRAW),
       textureBuffer : createGlBuffer(new Float32Array(texs), 2, texs.length/2, gl.STATIC_DRAW),
       vertexDynamic : null,
       colorDynamic : null,
       textureDynamic : null,
       primitive : gl.TRIANGLES
    });
}

function initObjects(gameState)
{      
    objects = []; // links graphics objects to game object
    gos = [];

    // -- background game objects
    objects.push(
    {
        geometry: GEOMETRY.HEX,
        goId : gos.length,
        shader : shaderNoise,
        texture: backgroundTex
    });
    var background = new GameObject();
    background.translate = hexBoard.gridPos;
    gos.push(background);

    //--- NPC game objects and item pickups
    var idx = hexBoard.findEmpty(); // don't allow blood and other things in same cell
    hexBoard.setHexType(idx, CAVE.BEAST);   
    var bloodcells = hexBoard.getNeighbors(idx);
    for (var i = 0; i < bloodcells.length; i++)
    {
        hexBoard.setHexType(bloodcells[i], CAVE.BLOOD);
        var npc = new NPC(-1); // infinite
        npc.placeInHex(bloodcells[i]);
        objects.push(
        {
           geometry: GEOMETRY.BLOOD,
           goId : gos.length,
           shader : shaderTex,
           texture: backgroundTex
        });

        gos.push(npc); 
    }

    gameState.items.forEach(function(item)
    {
       for (var j = 0; j < item.num; j++)
       {
          var npc = new Item(item.type, item.respawnTime);
          var idx = hexBoard.findEmpty();
          npc.placeInHex(idx);
          hexBoard.setHexType(idx,item.type);

          objects.push(
          {
             geometry: item.geom,
             goId : gos.length,
             shader : shaderTex,
             texture: backgroundTex
          });

          gos.push(npc); 
       }
    });


    // monster teeth
    upperTeeth = new Teeth(CAVE.TEETH, 0);
    objects.push(
    {    
       geometry: GEOMETRY.QUAD,
       goId: gos.length,
       shader : shaderTex,
       texture: teethTex
    });    
    gos.push(upperTeeth); 

    lowerTeeth = new Teeth(CAVE.TEETH, 0);
    objects.push(
    {    
       geometry: GEOMETRY.QUAD,
       goId: gos.length,
       shader : shaderTex,
       texture: teethTex
    });    
    gos.push(lowerTeeth);     

    //-- player object
    var idx = hexBoard.findEmpty();
    player.placeInHex(idx);    
    player.init();
    objects.push(
    {
       geometry: GEOMETRY.TRI,
       goId: gos.length,
       shader : shaderSolid,
       texture: backgroundTex
    });
    gos.push(player);

    objects.push(
    {
       geometry: GEOMETRY.STAR,
       goId: gos.length,
       shader: shaderSolid,
       texture: backgroundTex
    });
    gos.push(player.bullet);
}

function drawScene() 
{
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    mat4.ortho(left, right, bottom, up, 0.1, 100, pMatrix);
    mat4.identity(mvMatrix);

    objects.forEach(function(obj) 
    {
       var go = gos[obj.goId]; // game object
       if (go.enabled)
       {
          mvPushMatrix();
         
          mat4.translate(mvMatrix, [go.translate.x, go.translate.y, go.translate.z]);
          mat4.rotate(mvMatrix, go.rotate, [0, 0, 1]);
          mat4.scale(mvMatrix, [go.scale, go.scale, go.scale]);
    
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
          gl.uniform1f(obj.shader.time, time);
        
          gl.drawArrays(g.primitive, 0, g.vertexBuffer.numItems);
          mvPopMatrix();
       }
    });
}


function resetGame()
{
    paused = true;
    showMessage('title');
    nextCave();
    numCaves = 0;
    gameOver = false;
}

function nextCave()
{
    initTexture();
    hexBoard.resetBoard();
    hexBoard.computeMaze();
    initObjects(gameState);
    numCaves = numCaves + 1;
}

function spawnFatigue()
{
   showMessage('spawn');
   loseGame();
}

function badBullet()
{
   showMessage('eatenBullet');
   loseGame();
}

function enterBeastCavern()
{
   showMessage('eatenCavern');
   loseGame();
}

function loseGame()
{
   gameOver = true;
   for (var i = 1; i < gos.length; i++)
   {
      gos[i].enabled = false;
   }   
   upperTeeth.start({x:0.0,y:20.0}, Math.PI, {x:0.0,y:-10.0});
   lowerTeeth.start({x:0.0,y:-20.0}, Math.PI*2, {x:0.0,y:10.0});   
}

function winGame()
{
   gameOver = true;
   showMessage('escape');
   paused = true;
}

function animate() 
{
   var timeNow = new Date().getTime();
   if (lastTime != 0 && !paused) 
   {
      var dt = timeNow - lastTime;
      time += dt * 0.00005;
      for (var i = 0; i < gos.length; i++)
      {
         gos[i].update(dt);
      }

      var clickDt = (timeNow - lastClick) * 0.00005;
      if (queueMove && clickDt > DOUBLE_CLICK_THRESH + 0.001)
      {
         console.log("move "+clickDt);
         player.move({x:lastMouseX, y:lastMouseY});
         queueMove = false;
         lastClick = timeNow;
      }
   }
   lastTime = timeNow;
}

function updateGame()
{
   if (!gameOver)
   {
      if (player.isDead())
      {
         if (player.getDeathCause() === DEAD.NOISE)
         {
            badBullet();
         }
         else if (player.getDeathCause() === DEAD.BEAST)
         {
            enterBeastCavern();
         }
         else if (player.getDeathCause() === DEAD.SPAWN) // todo
         {
            spawnFatigue();
         }
      }
      else if (player.isVictor())
      {
         if (numCaves < maxCaves) 
         {
            nextCave();
            showMessage('slain');
         }
         else winGame();
      }
   }
}

function lookupNPC(idx)
{
   for (var i = 0; i < gos.length; i++)
   {
      if (gos[i].isNPC && gos[i].currentHex === idx) return gos[i];
   }
   return null;
}

function updateHUD()
{
   for (var i = 0; i < 6; i++)
   {
      if (i < player.health) $("#HB"+i).css('background','red');
      else $("#HB"+i).css('background','black');
   }

   // TODO: Update ammo count
}

function tick() 
{
    requestAnimFrame(tick);
    drawScene();
    animate();
    updateGame();
    updateHUD();
}

function showMessage(name)
{
   currentMsg = name;

   var canvas = document.getElementById("game-canvas");
   var canvasRect = canvas.getBoundingClientRect();
   var image = document.getElementById(name+"Img");

   var msgScreen = document.getElementById(name);
   msgScreen.style.left = (canvasRect.left+canvas.width*0.5-image.naturalWidth*0.5)+'px';
   msgScreen.style.top = '100px';
   msgScreen.style.opacity = 1.0;
   msgScreen.style.display = "inline";
}

function webGLStart() 
{
    var canvas = document.getElementById("game-canvas");
    initGL(canvas);
    initShaders();
    initBuffers();
    loadTextures();

    gameState = new GameState();
    initObjects(gameState);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); 
    gl.enable(gl.BLEND);   
    gl.enable(gl.DEPTH_TEST);   

    document.onkeydown = handleKeyDown;
    document.onmousemove = handleMouseMove;
    document.onmousedown = handleMouseDown;

    showMessage('title');
    tick();
}

