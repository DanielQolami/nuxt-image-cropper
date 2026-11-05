<script setup lang="ts">
import { shallowRef } from "vue";
import { useRoute } from "#imports";
import type { ImageCropperResult } from "../../../src/runtime/app/types/image-cropper.types";

// Observable fixture state lets browser tests verify the consumer-facing contracts.
const route = useRoute();
const open = shallowRef(route.query.open === "true");
const mounted = shallowRef(true);
const nestedOpen = shallowRef(false);
const sourceFile = shallowRef<File | null>(null);
const outputMimeType = route.query.format === "jpeg"
  ? "image/jpeg"
  : route.query.format === "webp" ? "image/webp" : "image/png";
const disabled = shallowRef(false);
const selections = shallowRef(0);
const cancellations = shallowRef(0);
const error = shallowRef("");
const result = shallowRef("");
const confirmations = shallowRef(0);

function setSourceFile(event: Event): void {
  sourceFile.value = (event.target as HTMLInputElement).files?.[0] ?? null;
}

function recordResult(value: ImageCropperResult): void {
  confirmations.value++;
  result.value = JSON.stringify({
    width: value.width,
    height: value.height,
    mimeType: value.mimeType,
    fileType: value.file?.type,
    size: value.blob?.size,
    dataUrl: value.dataUrl?.slice(0, 30),
    coordinates: value.coordinates,
  });
}
</script>

<template>
  <main>
    <h1>Host application heading</h1>
    <button id="open" type="button" @click="open = true">
      Open cropper
    </button>
    <button id="unmount" type="button" @click="mounted = !mounted">
      Toggle dialog
    </button>
    <button id="close" type="button" @click="open = false">
      Close externally
    </button>
    <input
      id="source-file"
      type="file"
      aria-label="External source file"
      @change="setSourceFile"
    >
    <label><input v-model="disabled" type="checkbox"> Disable dropzone</label>
    <ImageCropperDropzone
      data-testid="dropzone"
      class="consumer-class"
      :disabled="disabled"
      :max-size="1024"
      @select="selections++"
      @error="error = $event.code"
    />
    <ImageCropperDialog
      v-if="mounted"
      v-model:open="open"
      :file="sourceFile"
      :output-width="80"
      :output-height="80"
      :output-mime-type="outputMimeType"
      @cancel="cancellations++"
      @error="error = $event.code"
      @confirm="recordResult"
    >
      <template v-slot:description>
        Adjust the image before saving.
        <button id="nested-open" type="button" @click="nestedOpen = true">
          Open another cropper
        </button>
      </template>
    </ImageCropperDialog>
    <ImageCropperDialog v-model:open="nestedOpen">
      <template v-slot:title>
        Second cropper
      </template>
    </ImageCropperDialog>
    <output id="selections">{{ selections }}</output>
    <output id="cancellations">{{ cancellations }}</output>
    <output id="error">{{ error }}</output>
    <output id="result">{{ result }}</output>
    <output id="confirmations">{{ confirmations }}</output>
  </main>
</template>
