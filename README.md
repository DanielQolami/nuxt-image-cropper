# Nuxt Image Cropper

npm: https://www.npmjs.com/package/nuxt-image-cropper

A Nuxt 4 module for client-side image cropping with `vue-advanced-cropper`, packaged as easy-to-use components and a composable.

- Auto-registers components:
  - `ImageCropper`
  - `ImageCropperDialog`
  - `ImageCropperDropzone`
  - `ImageCropperPreview`
- Exposes composable:
  - `useImageCropperFile()`

![Screenshot](./src/docs/Screenshot_20260629_154917.png)

## Features

- Client-side image cropping (components are client-only)
- Component-based cropping UI (native dialog, dropzone, preview)
- isolated CSS with rose OKLCH colors
- Editable SVG components and existing slots for custom controls
- Reusable file composable (`useImageCropperFile()`)
- Structured crop output (File/Blob/DataURL + metadata)

## Installation

```bash
pnpm add nuxt-image-cropper
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["nuxt-image-cropper"],
});
```

or

```bash
npx nuxt module add nuxt-image-cropper
// or
pnpm dlx nuxt module add nuxt-image-cropper
```

## Usage

See [usage and customization](./src/docs/USAGE.md) for examples, CSS variables, slots, and migration from Nuxt UI styling.

Requires Nuxt 4.4+ and Vue 3.5+. The dialog uses native `showModal()` in modern browsers; animations are optional and respect reduced motion.

---

### Crop output type

The crop result uses this shape:

```ts
interface ImageCropperResult {
  file: File | null;
  blob: Blob | null;
  dataUrl: string | null;
  coordinates: ImageCropperCoordinates | null;
  image: ImageCropperImageInfo | null;
  width: number;
  height: number;
  mimeType: ImageCropperOutputMimeType;
}
```

## Components

### `ImageCropper`

Use when you already have a source image/file and want the cropper surface.

### `ImageCropperDialog`

Use when you want a complete workflow in a dialog (upload/select → crop → confirm).

### `ImageCropperDropzone`

Use when you want an upload/drop area with validation.

### `ImageCropperPreview`

Use to show a preview of the cropped result.

## Composable

### `useImageCropperFile()`

Shared file handling logic used by the cropper components.

## License

MIT

## Contributing

Pull requests welcome.
