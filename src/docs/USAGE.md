# Using the image-cropper module

This module is meant to be used as a small, reusable media primitive.

## Typical flow

1. Open the dialog.
2. Pick or drop a file.
3. Adjust the crop.
4. Confirm the result.
5. Send `result.file` or `result.blob` to your backend.

## Example

```vue
<script setup lang="ts">
import { shallowRef } from "vue";

// ImageCropperResult is auto-imported by the Nuxt module.
const open = shallowRef(false);
const output = shallowRef<ImageCropperResult | null>(null);

function handleConfirm(result: ImageCropperResult): void {
  output.value = result;
}
</script>

<template>
  <button type="button" @click="open = true">Crop image</button>

  <ImageCropperDialog
    v-model:open="open"
    preset="cover"
    output-mime-type="image/webp"
    :output-quality="0.9"
    @confirm="handleConfirm"
  />

  <pre v-if="output">{{ output.file?.name }}</pre>
</template>
```

## Using a custom file source

If the file is already available in your own flow, use `ImageCropper` directly and pass `src` plus `sourceFile`.

## Validation

Supported validation covers:

- missing file
- unsupported file type
- file too large

The default accept list includes:

- JPEG
- PNG
- WebP
- HEIC
- HEIF

## Output

The cropper can export:

- `File`
- `Blob`
- data URL
- dimensions
- coordinates
- image metadata

## When to use the preview component

Use `ImageCropperPreview` when you need a compact visual result, for example in profile forms or media settings panels.

## Styling and migration

The module ships isolated CSS with a rose OKLCH palette.
The `class` props still accept normal Vue class values.

CSS defaults follow the system color scheme and honor host `.light` / `.dark`
classes. To customize module colors, target its roots with your own class:

```html
<template>
  <ImageCropperDialog v-model:open="open" class="brand-cropper" />
</template>

<style>
/* Include nested component roots so every control uses the same override. */
.brand-cropper.image-cropper-theme,
.brand-cropper .image-cropper-theme {
  --image-cropper-primary-500: oklch(64.5% 0.246 16.439);
  --image-cropper-primary-600: oklch(58.6% 0.253 17.585);
  --image-cropper-primary-700: oklch(51.4% 0.222 16.935);
}
</style>
```

`--image-cropper-primary-50` through `--image-cropper-primary-950` hold the rose
palette. The default controls use 500 for focus/drop highlights, 600 for primary
buttons, and 700 for hover. Neutral tokens are `--image-cropper-surface`,
`--image-cropper-muted-surface`, `--image-cropper-text`,
`--image-cropper-muted-text`, and `--image-cropper-border`. Error tokens are
`--image-cropper-error` and `--image-cropper-error-surface`.

## Custom controls and icons

Existing slots can render controls from your own design system, including Nuxt UI:

```html
<ImageCropper :src="src">
  <template v-slot:zoomIn="{ disabled, zoomIn }">
    <button type="button" :disabled="disabled" @click="zoomIn">Zoom in</button>
  </template>
</ImageCropper>
```

`ImageCropper` provides `empty`, `zoomOut`, `zoomIn`, `rotateLeft`, `rotateRight`,
`reset`, `cancel`, and `confirm` slots. The action slots receive their callback and
`disabled`; `confirm` also receives `loading`. `ImageCropperDialog` provides
`title`, `description`, `error`, `cancel`, and `save`; its action slots receive
`disabled` and their callback. `ImageCropperDropzone` provides `label` and
`description` slots.

Each built-in SVG lives in its own Vue file under
`src/runtime/app/components/icons/`. Edit these files when maintaining the module;
no icon registry, font, or runtime request is involved. They are internal
components, not consumer auto-imports. In consuming apps, use the existing control
slots to replace controls and their icons. Icons inherit `currentColor` and sizing;
accessible names belong to their buttons.

## Browser behavior

The dialog requires a modern browser supporting native `HTMLDialogElement` and
`showModal()`. Escape, the close button, and a backdrop click dismiss it; the
Cancel button additionally emits `cancel`. External `open` updates remain
supported. Closing clears the selected input and its object URL; supplied `file`
props are reapplied when reopening.

Dialog CSS transitions are progressive enhancements and respect reduced motion.
Unsupported animation features do not prevent opening or closing. The dropzone
supports the native file picker and file dropping, using the first dropped file
and the same validation for both paths. Picker cancellation leaves selection
unchanged. Accepting HEIC/HEIF does not guarantee browser decoding support.
