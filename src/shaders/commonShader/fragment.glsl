varying vec2 vUv;

uniform vec3 uColor;

void main(){
vec2 uv = vUv;
vec3 col = uColor;

gl_FragColor = vec4(col, 1.);

}