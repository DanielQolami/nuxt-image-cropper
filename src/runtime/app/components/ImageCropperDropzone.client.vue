<script setup lang="ts">
import { type HTMLAttributes, computed, shallowRef, watch } from "vue";
import type {
  ImageCropperError,
  ImageCropperMimeType,
} from "../types/image-cropper.types";
import {
  DEFAULT_IMAGE_CROPPER_ACCEPT,
  DEFAULT_IMAGE_CROPPER_MAX_SIZE,
  validateImageFile,
} from "../utils/image-validation.utils";
import { cn } from "../utils/cn.utils";

interface ImageCropperDropzoneProps {
  accept?: readonly ImageCropperMimeType[];
  maxSize?: number;
  disabled?: boolean;
  class?: HTMLAttributes["class"];
}

interface ImageCropperDropzoneEmits {
  select: [file: File];
  error: [error: ImageCropperError];
}

interface ImageCropperDropzoneSlots {
  label(): unknown;
  description(): unknown;
}

const props = withDefaults(defineProps<ImageCropperDropzoneProps>(), {
  accept: () => DEFAULT_IMAGE_CROPPER_ACCEPT,
  maxSize: DEFAULT_IMAGE_CROPPER_MAX_SIZE,
  disabled: false,
});
const emit = defineEmits<ImageCropperDropzoneEmits>();
defineSlots<ImageCropperDropzoneSlots>();

const selectedFile = shallowRef<File | null>(null);
const acceptAttribute = computed(() => props.accept.join(","));

const rootClass = computed(() => {
  return cn("w-full", props.class);
});

let clearing = false;

watch(selectedFile, (nextFile) => {
  if (clearing) return;
  if (!nextFile) return;

  console.log("selectd file: ", selectedFile.value);
  const error = validateImageFile(nextFile, {
    accept: props.accept,
    maxSize: props.maxSize,
  });

  console.info("error: ", error?.message);

  if (error) {
    emit("error", error);
    clearing = true;
    selectedFile.value = null;
    clearing = false;
    return;
  }

  if (nextFile) {
    emit("select", nextFile);
  }
});
</script>

<template>
  <UFileUpload
    v-model="selectedFile"
    :class="rootClass"
    variant="area"
    layout="grid"
    size="xl"
    icon="i-lucide-image-plus"
    :accept="acceptAttribute"
    :dropzone="true"
    :interactive="true"
    :disabled="props.disabled"
  >
    <template v-slot:label>
      <slot name="label">
        Choose an image or drop it here
      </slot>
    </template>
    <template v-slot:description>
      <slot name="description">
        JPEG, PNG, WebP, HEIC, or HEIF. Max 5 MB.
      </slot>
    </template>
  </UFileUpload>
</template>
