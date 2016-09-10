var fragmentShaderSource_Tex = `
   precision mediump float;
   varying vec2 vTextureCoord;
   varying vec4 vColor;
   uniform sampler2D uSampler;

   void main(void) 
   {
      vec4 textureColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
      gl_FragColor = vec4(textureColor.rgb * vColor.rgb, vColor.a);
   }
`;

var fragmentShaderSource_Solid = `
   precision mediump float;
   varying vec4 vColor;

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

    void main(void) 
    {
        vec4 textureColor = vec4(1,1,1,1) - texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
        gl_FragColor = vec4(textureColor.rgb * vColor.rgb, vColor.a);
    }
`;
