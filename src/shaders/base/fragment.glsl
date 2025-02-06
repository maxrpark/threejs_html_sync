varying vec2 vUv;


void main(){
vec2 uv = vUv;
vec3 col = vec3(uv.x,uv.y,.0);

gl_FragColor = vec4(col, 1.);

}