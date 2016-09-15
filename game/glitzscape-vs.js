var vertexShaderSource = `
    attribute vec3 aVertexPosition;
    attribute vec2 aTextureCoord;
    attribute vec4 aColor;

    uniform mat4 uMVMatrix;
    uniform mat4 uPMatrix;

    varying vec2 vTextureCoord;
    varying vec4 vColor;

  void main() {
        gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
        vTextureCoord = aTextureCoord;
        vColor = aColor;
  }
`; 

