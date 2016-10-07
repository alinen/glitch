var vertexShaderSource = `
    attribute vec3 aVertexPosition;
    attribute vec2 aTextureCoord;
    uniform mat4 uPMatrix; 
    varying vec2 vTextureCoord;

  void main() {
        gl_Position = uPMatrix * vec4(aVertexPosition, 1.0);
        vTextureCoord = aTextureCoord;
  }
`; 

var fragmentShaderSource_Spin = `
   precision mediump float;
   varying vec2 vTextureCoord;
   uniform sampler2D uSampler;
   uniform float uT;

   void main(void) 
   {
      float s = (vTextureCoord.s-0.5)*2.0; // center around (0,0)
      float t = (vTextureCoord.t-0.5)*2.0;

      float r = length(vec2(s,t)); // rotate
      s = r*sin(uT);
      t = r*cos(uT);

      s = s*0.5+0.5; // move back
      t = t*0.5+0.5; // move back
      vec4 textureColor = texture2D(uSampler, vec2(s, t));
      gl_FragColor = textureColor;
   }
`;

var gl;
var shaderSpin;
var textures = [];
var texture; // current texture
var currentTex = 0;
var time = 0;
var lastTime = 0;
var pMatrix = mat4.create();
var vertexBuffer;
var textureBuffer;

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
    sp.samplerUniform = gl.getUniformLocation(sp, "uSampler");
    sp.time = gl.getUniformLocation(sp, "uT");
    
    return sp;
}

function initShaders() 
{
    var fragmentShader = getShader(gl, fragmentShaderSource_Spin, gl.FRAGMENT_SHADER);
    var vertexShader = getShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
    shaderSpin = initShader(fragmentShader, vertexShader);
}

function handleLoadedTexture(texture) 
{
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); 
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null);
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
    var sVertices = [
         1,  1, -1,
        -1,  1, -1,
         1, -1, -1,
        -1, -1, -1
    ];
    var sTexs = [      
         1.0, 1.0,
         0.0, 1.0, 
         1.0, 0.0, 
         0.0, 0.0
    ];
    
    vertexBuffer = createGlBuffer(new Float32Array(sVertices), 3, 4, gl.STATIC_DRAW);
    textureBuffer = createGlBuffer(new Float32Array(sTexs), 2, 4, gl.STATIC_DRAW);
}

function drawScene() 
{
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    mat4.ortho(-0.5, 0.5, -0.5, 0.5, 0.1, 10, pMatrix);
    gl.useProgram(shaderSpin);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(shaderSpin.vertexPositionAttribute, vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
     
    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
    gl.vertexAttribPointer(shaderSpin.textureCoordAttribute, textureBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(shaderSpin.samplerUniform, 0);

    gl.uniformMatrix4fv(shaderSpin.pMatrixUniform, false, pMatrix);
    gl.uniform1f(shaderSpin.time, time);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexBuffer.numItems);
}

function animate() 
{
   var timeNow = new Date().getTime();
   if (lastTime != 0) 
   {
      var dt = timeNow - lastTime;
      time += dt * 0.00005;
   }
   lastTime = timeNow;
}

function tick() 
{
    requestAnimFrame(tick);
    drawScene();
    animate();
}

function handleMouseDown(evt)
{
    currentTex = (currentTex+1) % textures.length;
    texture = textures[currentTex];
}

function webGLStart() 
{
    var canvas = document.getElementById("game-canvas");
    initGL(canvas);
    initShaders();
    initBuffers();
    textures.push(initTextureFromFile('stripesTest3.png'));
    textures.push(initTextureFromFile('stripesTest1.png'));
    textures.push(initTextureFromFile('stripesTest2.png'));
    textures.push(initTextureFromFile('stripesTest4.png'));
    textures.push(initTextureFromFile('stripesTest5.png'));
    textures.push(initTextureFromFile('stripesTest6.png'));
    textures.push(initTextureFromFile('stripesTest7.png'));
    texture = textures[0];
    currentTex = 0;

    document.onmousedown = handleMouseDown;

    gl.clearColor(0.4, 0.0, 0.0, 1.0);
    tick();
}


