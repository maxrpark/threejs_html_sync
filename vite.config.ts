import glsl from "vite-plugin-glsl";
import tailwindcss from "@tailwindcss/vite";

export default {
  plugins: [glsl(), tailwindcss()],
};
