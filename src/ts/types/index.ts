import * as THREE from "three";

export type MeshShaderMaterial = THREE.Mesh<
  THREE.BufferGeometry<THREE.NormalBufferAttributes>,
  THREE.ShaderMaterial,
  THREE.Object3DEventMap
>;

export type ElementType = HTMLDivElement | HTMLImageElement | HTMLSpanElement;
