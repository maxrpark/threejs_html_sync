# Syncing Three.js Objects with HTML Elements: A Walkthrough

## Introduction

A demo project demonstrating a way of aligning 3D objects with corresponding DOM elements while maintaining accurate positioning and sizes during scrolling and resizing.

### Live Demo

You can view a live demo of the project here: [LIVE DEMO](https://threejs-html-sync.vercel.app/)

## Project Setup

First, install the dependencies and start the development server:

```sh
npm install
npm run dev
```

### Expected Outcome

Once the project runs successfully, you should see a webpage where:

3D objects (text and images) are rendered in sync with corresponding HTML elements.
Scrolling smoothly updates the position of 3D objects, maintaining alignment with the DOM.
Resizing the window dynamically adjusts the Three.js scene to match the new layout.
Text is rendered as 3D objects using Troika-Three-Text, and images are mapped onto planes with shader effects.

## Main Files

Before diving into the synchronization process, ensure you have a working development environment. The codebase consists of the following files:

- `index.html` – Contains the structure of the webpage.
- `style.css` – Handles styles, including visibility settings and font imports.
- `main.js` – Initializes and manages the Three.js scene.

Ensure that you have all dependencies, including `Three.js`, `Lenis` (for smooth scrolling), and `Troika-Three-Text` (for rendering 3D text).

## Initializing the Three.js Scene

The first step is to set up a Three.js scene inside `main.js`. The most important part is the camera, especially the FOV.

```javascript
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
```

## Extracting Properties from HTML Elements

To ensure the 3D objects match their HTML counterparts, we extract properties such as font size, color, and background color from the elements using `getComputedStyle`.

```javascript
const getElementProperties = (element) => {
  const { fontSize, color, backgroundColor, fontFamily } =
    getComputedStyle(element);
  return { fontSize, color, backgroundColor, fontFamily };
};
```

## Creating 3D Objects from HTML Elements

### Understanding the HTML Structure

Before converting HTML elements into Three.js objects, let's analyze a section of the HTML code:

```javascript
<section>
  <h2 class='text-reference section-title text-[#a7b4e0]'>
    Modern Utopia Living room
  </h2>
  <div class='content-block img-container bg-[#a7b4e0]'>
    <img class='inner-img' src='/img/image-1.jpg' alt='' />
  </div>
  <div class='content-block bg-[#a7b4e0]'>
    <p class='description text-reference'>
      A stunning futuristic home design, featuring sleek architecture, advanced
      technology, and an atmosphere of innovation and elegance. This visionary
      space seamlessly integrates modern aesthetics with intelligent design,
      offering a sophisticated yet functional living environment built for the
      future.
    </p>
  </div>
</section>
```

### This section consists of:

An element with a text-reference class, which is used to extract text properties and synchronize them with a 3D text object in Three.js.

Two div elements labeled as content-block.

The first contains an image inside an img-container class, which will be represented as a plane in the Three.js scene.

The second contains descriptive text, which will also be converted into a Three.js object and synchronized with scrolling.

This structure allows us to map each HTML component to a corresponding WebGL object, ensuring alignment and dynamic interaction.

### Visibility Hidden or Opacity 0

Two hide the HTML elements you have two main options: `visibility: hidden` and `opacity: 0`.

Here’s how they differ, especially with regard to **accessibility**:

- **`opacity: 0`**:

  - The element is **still part of the DOM** and accessible to **screen readers**. It remains in the document flow, meaning assistive technologies (like screen readers) can still detect the element and announce its content to users.
  - It is still **interactive**, meaning users can still focus on and interact with the element, even though it is not visible.
  - **Use Case**: If you want an element to be hidden from sighted users but still readable by screen readers or interactable by users (e.g., for form fields, links, or text that should remain accessible), **`opacity: 0`** is the better choice.

- **`visibility: hidden`**:
  - The element is **removed from the accessibility tree** and will **not be detected by screen readers**. It’s effectively invisible to both sighted users and users relying on assistive technologies.
  - The element is still **part of the layout** and takes up space, but it **cannot be interacted with** (i.e., you can’t focus on it or click it).
  - **Use Case**: If you want an element to be completely invisible and non-interactive to both sighted users and assistive technologies, **`visibility: hidden`** is the better choice.

### Which to Use for Accessibility?

- **For screen readers**: If you want content (like text) to remain **readable** by screen readers, **`opacity: 0`** is the preferred option.

- **For non-interactivity**: If you need to hide elements completely, making them **inaccessible to both sighted users and screen readers**, **`visibility: hidden`** might be more appropriate. However, keep in mind that this could create gaps in the experience for users who rely on assistive technologies.

In this project, it used **`opacity: 0`**.

## Creating Planes for Images and Sections

For image elements, we use a `PlaneGeometry` mesh and apply a shader material with a texture loaded from the corresponding image source.

```javascript
const textureLoader = new THREE.TextureLoader();
const geometry = new THREE.PlaneGeometry(1, 1, 32, 32);
```

## Get or Create Material.

The createOrGetMaterial function is responsible for managing the creation and reuse of THREE.ShaderMaterial instances. It caches materials based on specific properties of the HTML elements (e.g., image source, background color, or text color) to ensure that the same material is not cloned multiple times, improving performance and reducing memory usage.

For image elements, the function checks the source URL and loads the corresponding texture. For color-based elements (like divs with a background color), it creates a unique material based on that color. If the element represents text, a material is created based on the text's color. If no matching material exists, a new one is created and cached for future use.

By caching materials, we avoid unnecessary cloning, ensuring that the same material is reused across multiple elements with similar properties.

```js
const baseMaterial = new THREE.ShaderMaterial({
  vertexShader,
  uniforms: {
    uVelocity: new THREE.Uniform(0),
  },
});

  const materialCache = new Map<string, THREE.ShaderMaterial>();
  // This function retrieves a material from the cache or creates a new one based on the element's type and properties, helping avoid cloning the same material multiple times.
  const createOrGetMaterial = (element: ElementType) => {
    let material;

    if (element instanceof HTMLImageElement) {
      material = materialCache.get(element.src); // Keep image texture-based cache
      if (!material) {
        const clonedMaterial = baseMaterial.clone();
        clonedMaterial.fragmentShader = imgFragmentShader;
        clonedMaterial.uniforms.uSample = new THREE.Uniform(
          textureLoader.load(element.src)
        );
        materialCache.set(element.src, clonedMaterial); // Cache image-based materials
        material = clonedMaterial;
      }
    } else if (element instanceof HTMLDivElement) {
      const { backgroundColor } = getElementProperties(element);

      // Check if there's already a material with this background color
      material = materialCache.get(`bg-${backgroundColor}`);

      if (!material) {
        // If not, create a new one and store it in the cache
        const clonedMaterial = baseMaterial.clone();
        clonedMaterial.fragmentShader = fragmentShader;
        clonedMaterial.uniforms.uColor = new THREE.Uniform(
          new THREE.Color(backgroundColor).toArray()
        );

        materialCache.set(`bg-${backgroundColor}`, clonedMaterial); // Cache color-based materials
        material = clonedMaterial;
      }
    } else if (element.classList.contains("single-character")) {
      const { color } = getElementProperties(element);

      material = materialCache.get(`char-${color}`);

      if (!material) {
        const clonedMaterial = baseMaterial.clone();
        clonedMaterial.fragmentShader = fragmentShader;
        clonedMaterial.vertexShader = textVertexShader;
        clonedMaterial.uniforms.uColor = new THREE.Uniform(
          new THREE.Color(color).toArray()
        );

        materialCache.set(`char-${color}`, clonedMaterial);
        material = clonedMaterial;
      }
    } else {
      material = baseMaterial.clone();
    }

    return material;
  };
```

### Create Plane

```javascript
const createPlane = (element: ElementType) => {
  const material = createOrGetMaterial(element);
  const mesh = new THREE.Mesh(geometry, material);
  const { width, height } = element.getBoundingClientRect();
  mesh.scale.set(width, height, 1);
  mesh.userData.htmlElement = element;
  return mesh;
};
```

### Creating 3D Text Objects

For textual elements, we use `Troika-Three-Text` to render text in 3D space.

```javascript
import { Text } from "troika-three-text";

  const create2DCharacter = (element: HTMLSpanElement) => {
    const material = createOrGetMaterial(element);

    const { fontSize, fontFamily } = getElementProperties(element);
    const textMesh = new Text();
    textMesh.text = element.textContent!;
    textMesh.fontSize = parseFloat(fontSize);

    textMesh.font = fontFamily;
    textMesh.material = material;

    textMesh.sync();
    const group = new THREE.Group();
    group.add(textMesh as unknown as MeshShaderMaterial);
    group.userData.htmlElement = element;

    return group;
  };
```

## Positioning and Updating Elements

To synchronize the position of the Three.js objects with their corresponding HTML elements, we update their coordinates dynamically using Lenis for scrolling events.

```javascript
const updatePlanesPosition = (planes) => {
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
```

### Handling Scrolling with Lenis

```javascript
import Lenis from "lenis";
const lenis = new Lenis({ autoRaf: true });

let ticking = false;
lenis.on("scroll", () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      updatePlanesPosition(planesObjects);
      ticking = false;
    });
    ticking = true;
  }
});
```

### Handling Window Resize Events

```javascript
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
```

## Rendering the Scene

```javascript
const tick = () => {
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
};
tick();
```

## Conclusion

By following this approach, we can seamlessly integrate WebGL elements into an HTML-based layout, allowing for smooth animations and interactions. Synchronizing Three.js objects with HTML elements provides endless possibilities for dynamic and engaging user experiences.

This technique can be extended further by incorporating physics simulations, interactive controls, and more refined shader effects. Explore and experiment to create visually stunning web experiences!

# threejs_html_sync
