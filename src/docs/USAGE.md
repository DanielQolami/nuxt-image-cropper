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
import type { ImageCropperResult } from "#image-cropper";

const open = shallowRef(false);
const output = shallowRef<ImageCropperResult | null>(null);

function handleConfirm(result: ImageCropperResult): void {
  output.value = result;
}
</script>

<template>
  <UButton label="Crop image" @click="open = true" />

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

## Future enhancement

A good next step is adding optional compression before upload with `browser-image-compression`, especially for user-uploaded photos from mobile devices.
