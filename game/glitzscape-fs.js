var fragmentShaderSource_SimpleTex = `
   precision mediump float;
   varying vec3 vTextureCoord;
   varying vec3 vColor;
   uniform sampler2D uSampler;

   void main(void) 
   {
      gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
   }
`;

var fragmentShaderSource_SimpleBlend = `
   precision mediump float;
   varying vec3 vTextureCoord;
   varying vec3 vColor;
   uniform sampler2D uSampler;
   uniform float uAlpha;

   void main(void) 
   {
      vec4 textureColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
      gl_FragColor = vec4(textureColor.rgb, textureColor.a * uAlpha);
   }
`;

var fragmentShaderSource_ForegroundBlend = `
   precision mediump float;
   varying vec3 vTextureCoord;
   varying vec3 vColor;
   uniform sampler2D uSampler;
   uniform float uAlpha;

   void main(void) 
   {
      vec4 textureColor = texture2D(uSampler, vec2(vTextureCoord.x, vTextureCoord.y));
      gl_FragColor = vec4(vColor * textureColor.rgb, textureColor.a * vTextureCoord.z);
   }
`;


var fragmentShaderSource_Solid = `
   precision mediump float;
   varying vec3 vTextureCoord;
   varying vec3 vColor;
   uniform sampler2D uSampler;

   void main(void) 
   {
      gl_FragColor = vec4(vColor,1.);
   }
`;

// invert
var fragmentShaderSource_InvertTex = `
   precision mediump float;
   varying vec3 vTextureCoord;
   varying vec3 vColor;
   uniform sampler2D uSampler;

    void main(void) 
    {
        gl_FragColor = vec4(1,1,1,0) -  texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
        gl_FragColor.a = 1.0;
    }
`;
