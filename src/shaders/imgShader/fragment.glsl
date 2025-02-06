varying vec2 vUv;

uniform sampler2D uSample;



void main(){
vec2 uv = vUv;
vec3 col = texture2D(uSample,uv).rgb;

gl_FragColor = vec4(col, 1.);

}