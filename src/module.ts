import {
  defineNuxtModule,
  addImports,
  addComponent,
  createResolver,
} from "@nuxt/kit";

// Module options TypeScript interface definition
export interface ModuleOptions {}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: "nuxt-image-cropper",
    configKey: "imageCropper",
    compatibility: {
      nuxt: ">=4.4.0",
    },
  },
  // Default configuration options of the Nuxt module
  defaults: {},
  moduleDependencies: {
    "@nuxt/ui": {
      version: ">=4.9.0",
    },
    "@vueuse/nuxt": {
      version: ">=14.3.0",
    },
    // prettier-ignore
    /* "tailwindcss": {
      version: ">=4.0.0",
    }, */
  },
  setup(_options, nuxt) {
    const resolver = createResolver(import.meta.url);

    // We can inject our CSS file which includes Tailwind's directives
    nuxt.options.css.push(resolver.resolve("./runtime/app/assets/main.css"));
    nuxt.options.css.push("vue-advanced-cropper/dist/style.css");

    // export components
    addComponent({
      name: "ImageCropper",
      filePath: resolver.resolve(
        "./runtime/app/components/ImageCropper.client.vue",
      ),
    });

    addComponent({
      name: "ImageCropperDialog",
      filePath: resolver.resolve(
        "./runtime/app/components/ImageCropperDialog.client.vue",
      ),
    });

    addComponent({
      name: "ImageCropperDropzone",
      filePath: resolver.resolve(
        "./runtime/app/components/ImageCropperDropzone.client.vue",
      ),
    });

    addComponent({
      name: "ImageCropperPreview",
      filePath: resolver.resolve(
        "./runtime/app/components/ImageCropperPreview.client.vue",
      ),
    });

    // export composables
    addImports([
      {
        name: "useImageCropperFile",
        from: resolver.resolve("./runtime/app/composables/useImageCropperFile"),
      },
    ]);

    // export types
    addImports([
      {
        name: "ImageCropperResult",
        type: true,
        from: resolver.resolve("./runtime/app/types/image-cropper.types"),
      },
    ]);
  },
});
