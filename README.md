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
- Component-based cropping UI (dialog, dropzone, preview)
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

See the usage reference in `src/docs/USAGE.md` (in this repo) for the minimal examples.

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
