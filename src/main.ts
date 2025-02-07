import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module.js";
import SplitType from "split-type";
import { Text, preloadFont } from "troika-three-text";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

import vertexShader from "./shaders/commonShader/vertex.glsl";
import fragmentShader from "./shaders/commonShader/fragment.glsl";
import imgFragmentShader from "./shaders/imgShader/fragment.glsl";
import textVertexShader from "./shaders/textShader/vertex.glsl";

import { MeshShaderMaterial } from "./ts/types";

const fontsToPreload = [
  {
    font: "/fonts/Anton/Anton-Regular.ttf",
    characters: "abcdefghijklmnopqrstuvwxyz",
  },
  {
    font: "/fonts/Barlow_Condensed/BarlowCondensed-Regular.ttf",
    characters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  },
];

let preloadCount = 0;
// Ensure fonts are loaded before initializing the scene
const onFontLoaded = () => {
  preloadCount++;
  if (preloadCount === fontsToPreload.length) {
    console.log("All fonts preloaded!");
    initializeScene(); // 🎯 Initialize only when fonts are ready
  }
};

// Preload Fonts
fontsToPreload.forEach(({ font, characters }) => {
  preloadFont({ font, characters }, onFontLoaded);
});

// Global Variables

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
};

const fontMap: Record<string, string> = {
  Anton: "/fonts/Anton/Anton-Regular.ttf",
  "Barlow Condensed": "/fonts/Barlow_Condensed/BarlowCondensed-Regular.ttf",
};
const planesObjects: MeshShaderMaterial[] = [];
const text2DObjects: THREE.Group[] = [];
const textureLoader = new THREE.TextureLoader();

// Function: Initialize Three.js Scene (only after fonts are preloaded)
const initializeScene = () => {
  // Get Element Properties
  const getElementProperties = (element: HTMLDivElement | HTMLImageElement) => {
    const { fontSize, color, backgroundColor, fontFamily } =
      getComputedStyle(element);

    const cleanedFontFamily = fontFamily
      .replace(/['"]/g, "")
      .split(",")[0]
      .trim();

    return {
      fontFamily:
        fontMap[cleanedFontFamily] ||
        "/fonts/Barlow_Condensed/BarlowCondensed-Regular.ttf",
      fontSize,
      color,
      backgroundColor,
    };
  };

  // Initialize Lenis
  const lenis = new Lenis({ autoRaf: true });

  // Get HTML Elements
  const canvas = document.getElementById("webgl-canvas")!;
  const contentBlocks = document.querySelectorAll(".content-block");
  const innerImages = document.querySelectorAll(".inner-img");

  // Create a div with the class single-character for each character
  const textElements = new SplitType(".text-reference", {
    types: "chars",
    tagName: "span",
    charClass: "single-character",
  }).chars!;

  const allElements = [
    ...contentBlocks,
    ...innerImages,
    ...textElements,
  ] as HTMLDivElement[];

  // Setup Three.js Scene
  const scene = new THREE.Scene();
  const stats = new Stats();
  document.body.appendChild(stats.dom);

  // Camera Setup

  // Calculating the FOV for the Perspective camera
  // This method ensures that the camera’s field of view (FOV) adjusts dynamically to fit the screen height.
  //https://github.com/mrdoob/three.js/issues/1239

  const positionZ = 100;
  const fov = 2 * Math.atan(sizes.height / 2 / positionZ) * (180 / Math.PI);

  const camera = new THREE.PerspectiveCamera(
    fov,
    sizes.width / sizes.height,
    0.01,
    1000
  );
  camera.position.set(0, 0, positionZ);
  scene.add(camera);

  // Define Materials & Objects
  const geometry = new THREE.PlaneGeometry(1, 1, 32, 32);
  const baseMaterial = new THREE.ShaderMaterial({
    vertexShader,
    uniforms: {
      uVelocity: new THREE.Uniform(0),
    },
  });

  const createPlane = (element: HTMLDivElement | HTMLImageElement) => {
    const material = baseMaterial.clone();

    if (element instanceof HTMLImageElement) {
      material.fragmentShader = imgFragmentShader;
      material.uniforms.uSample = new THREE.Uniform(
        textureLoader.load(element.src)
      );
    } else if (element instanceof HTMLDivElement) {
      material.fragmentShader = fragmentShader;
      const { backgroundColor } = getElementProperties(element);
      material.uniforms.uColor = new THREE.Uniform(
        new THREE.Color(backgroundColor).toArray()
      );
    }

    const mesh = new THREE.Mesh(geometry, material);

    const { width, height } = element.getBoundingClientRect();
    mesh.scale.set(width, height, 1);

    mesh.userData.htmlElement = element;

    return mesh;
  };

  const create2DCharacter = (element: HTMLDivElement) => {
    const material = baseMaterial.clone();
    material.fragmentShader = fragmentShader;
    material.vertexShader = textVertexShader;

    const { fontSize, color, fontFamily } = getElementProperties(element);
    const textMesh = new Text();
    textMesh.text = element.textContent!;
    textMesh.fontSize = parseFloat(fontSize);

    textMesh.font = fontFamily;
    textMesh.material = material;
    material.uniforms.uColor = new THREE.Uniform(
      new THREE.Color(color).toArray()
    );

    textMesh.sync();
    const group = new THREE.Group();
    group.add(textMesh as unknown as MeshShaderMaterial);
    group.userData.htmlElement = element;

    return group;
  };

  // Create Objects from Elements
  allElements.forEach((element) => {
    let object3D;
    if (!element.classList.contains("single-character")) {
      object3D = createPlane(element);
      planesObjects.push(object3D);
    } else {
      object3D = create2DCharacter(element);
      text2DObjects.push(object3D);
    }

    scene.add(object3D);
  });

  // Renderer Setup
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(sizes.pixelRatio);
  renderer.setClearColor("#ffffff", 0);

  // Update Objects
  const updatePlanesPosition = (
    planes: MeshShaderMaterial[] | THREE.Group[]
  ) => {
    planes.forEach((plane) => {
      const { left, top, width, height } =
        plane.userData.htmlElement.getBoundingClientRect();
      plane.position.set(
        left - document.body.offsetWidth / 2 + width / 2,
        -top + window.innerHeight / 2 - height / 2,
        0
      );
    });
  };

  const updateTexts2DPosition = (planes: THREE.Group[]) => {
    planes.forEach((plane) => {
      const { left, top } = plane.userData.htmlElement.getBoundingClientRect();
      plane.position.set(
        left - document.body.offsetWidth / 2,
        -top + window.innerHeight / 2,
        0
      );
    });
  };

  // Events
  let ticking = false;
  lenis.on("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updatePlanesPosition(planesObjects);
        updateTexts2DPosition(text2DObjects);
        ticking = false;
      });
      ticking = true;
    }
  });

  window.addEventListener("resize", () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    sizes.pixelRatio = Math.min(window.devicePixelRatio, 2);

    //  Normally, only the aspect ratio is updated, but since the vertical field of view (FOV) affects perceived scale, adjusting it ensures a consistent look.
    camera.fov = 2 * Math.atan(sizes.height / 2 / positionZ) * (180 / Math.PI);

    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(sizes.pixelRatio);

    text2DObjects.forEach((plane) => {
      const { fontSize } = getElementProperties(plane.userData.htmlElement);
      const textMesh = plane.children[0];
      if (textMesh instanceof Text) {
        textMesh.fontSize = parseFloat(fontSize);
        textMesh.sync();
      }
    });

    planesObjects.forEach((plane) => {
      const { width, height } =
        plane.userData.htmlElement.getBoundingClientRect();
      plane.scale.set(width, height, 1);
    });

    updatePlanesPosition(planesObjects);
    updateTexts2DPosition(text2DObjects);
  });

  // Animation Loop
  const tick = () => {
    stats.begin();
    renderer.render(scene, camera);

    planesObjects.forEach((mesh) => {
      mesh.material.uniforms.uVelocity.value = lenis.velocity * 0.01;
    });

    text2DObjects.forEach((group) => {
      (
        group.children[0] as MeshShaderMaterial
      ).material.uniforms.uVelocity.value = lenis.velocity * 0.005;
    });

    stats.end();
    window.requestAnimationFrame(tick);
  };

  updatePlanesPosition(planesObjects);
  updateTexts2DPosition(text2DObjects);
  tick();
};
