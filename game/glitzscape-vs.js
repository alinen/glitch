var vertexShaderSource = `
    attribute vec3 aVertexPosition;
    attribute vec3 aTextureCoord;
    attribute vec3 aColor;

    uniform mat4 uMVMatrix;
    uniform mat4 uPMatrix;

    varying vec3 vTextureCoord;
    varying vec3 vColor;

  void main() {
        gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
        vTextureCoord = aTextureCoord;
        vColor = aColor;
  }
`; 

