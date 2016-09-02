var fragmentShaderSource = `
   precision mediump float;
   varying vec2 vTextureCoord;
   uniform sampler2D uSampler;

    void main(void) {
        gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
        //gl_FragColor  =vec4(1,1,1,1);
    }
`;

var fragmentShaderSource2 = `
   precision mediump float;
   varying vec2 vTextureCoord;
   uniform sampler2D uSampler;

    void main(void) {
        vec4 c = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
        if (c.r == 1.0) gl_FragColor = vec4(0.,0.,0.,1.);
        else gl_FragColor = vec4(1.,0.,0.,1.);
    }
`;

var fragmentShaderSource3 = `
   precision mediump float;
   varying vec2 vTextureCoord;
   uniform sampler2D uSampler;

    void main(void) {
        gl_FragColor = vec4(0.,1.,1.,1.);
    }
`;

// invert
var fragmentShaderSource1 = `
   precision mediump float;
   varying vec2 vTextureCoord;
   uniform sampler2D uSampler;

    void main(void) {
        gl_FragColor = vec4(1,1,1,0) -  texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
        gl_FragColor.a = 1.0;
    }
`;
