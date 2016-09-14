var fragmentShaderSource_Tex = `
   precision mediump float;
   varying vec2 vTextureCoord;
   varying vec4 vColor;
   uniform sampler2D uSampler;
   uniform float uT;

   void main(void) 
   {
      vec4 textureColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
      gl_FragColor = vec4(textureColor.rgb * vColor.rgb, textureColor.a * vColor.a);
   }
`;

var fragmentShaderSource_Noise = `
   precision mediump float;
   varying vec2 vTextureCoord;
   varying vec4 vColor;
   uniform sampler2D uSampler;
   uniform float uT;

   void main(void) 
   {
      vec4 textureColor = texture2D(uSampler, vec2(vTextureCoord.s+uT,vTextureCoord.t));
      gl_FragColor = vec4(textureColor.rgb * vColor.rgb, textureColor.a * vColor.a);
   }
`;


var fragmentShaderSource_NoiseSpin = `
   precision mediump float;
   varying vec2 vTextureCoord;
   varying vec4 vColor;
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
      gl_FragColor = vec4(textureColor.rgb * vColor.rgb, textureColor.a * vColor.a);
   }
`;


var fragmentShaderSource_Solid = `
   precision mediump float;
   varying vec2 vTextureCoord;
   varying vec4 vColor;
   uniform sampler2D uSampler;
   uniform float uT;

   void main(void) 
   {
      gl_FragColor = vColor;
   }
`;

// invert
var fragmentShaderSource_TexInvert = `
   precision mediump float;
   varying vec2 vTextureCoord;
   varying vec4 vColor;
   uniform sampler2D uSampler;
   uniform float uT;

    void main(void) 
    {
        vec4 textureColor = vec4(1,1,1,0) - texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
        gl_FragColor = vec4(textureColor.rgb * vColor.rgb, vColor.a);
    }
`;
