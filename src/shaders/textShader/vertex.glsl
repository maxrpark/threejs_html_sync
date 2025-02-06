varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

uniform float uVelocity;


vec3 applyScreenRelativeDisplacement(vec3 position, mat4 modelMatrix, mat4 viewMatrix, mat4 projectionMatrix, float uVelocity) {
   vec3 worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;

   vec4 clipPosition = projectionMatrix * viewMatrix * vec4(worldPosition, 1.0);

   vec2 screenPos = clipPosition.xy / clipPosition.w;  

   float strength = 1.0 - abs(screenPos.x);  

   position.y += worldPosition.x * -uVelocity * strength ;

    return position;
}

void main() {	

  vec3 newPosition = applyScreenRelativeDisplacement(position, modelMatrix, viewMatrix, projectionMatrix, uVelocity);


  vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;
  gl_Position = projectedPosition;



  vUv = uv;
  vNormal = (modelMatrix * vec4(normal,0.0)).xyz;
  vPosition = newPosition;


}