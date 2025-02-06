declare module "troika-three-text" {
  export class Text {
    text: string | number;
    fontSize: number;
    color: string;
    anchorX?: string | number;
    anchorY?: string | number;
    textAlign: string;
    lineHeight: number;
    font: string;
    visible: boolean;
    material: THREE.ShaderMaterial;

    sync(): void;
    dispose(): void;
    preloadFont(): void;
  }
  export function preloadFont(
    options: { font: string; characters?: string },
    callback?: () => void
  ): void;
}
