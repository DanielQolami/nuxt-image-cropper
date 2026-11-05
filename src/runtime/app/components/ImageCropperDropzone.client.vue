<script setup lang="ts">
import { type HTMLAttributes, computed, useId, useTemplateRef } from "vue";
import { useDropZone } from "#imports";
import type {
  ImageCropperError,
  ImageCropperMimeType,
} from "../types/image-cropper.types";
import {
  DEFAULT_IMAGE_CROPPER_ACCEPT,
  DEFAULT_IMAGE_CROPPER_MAX_SIZE,
  formatBytes,
  validateImageFile,
} from "../utils/image-validation.utils";
import { cn } from "../utils/cn.utils";
import ImagePlusIcon from "./icons/ImagePlusIcon.vue";

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

// Stable IDs associate the native input with the consumer's slotted text.
const inputId = useId();
const dropzoneEl = useTemplateRef<HTMLLabelElement>("dropzone-ref");
const acceptAttribute = computed(() => props.accept.join(","));
const description = computed(() => {
  const formats = props.accept.map(type => type.replace("image/", "").toUpperCase());
  return `${formats.join(", ")}. Max ${formatBytes(props.maxSize)}.`;
});

/** Both entry paths share validation so invalid drops emit the same typed errors. */
function selectFile(file: File | undefined): void {
  if (props.disabled || !file) return;

  const error = validateImageFile(file, {
    accept: props.accept,
    maxSize: props.maxSize,
  });

  if (error) {
    emit("error", error);
    return;
  }

  emit("select", file);
}

// Validate File objects ourselves instead of silently filtering dropped MIME types.
const { isOverDropZone } = useDropZone(dropzoneEl, {
  checkValidity: () => !props.disabled,
  preventDefaultForUnhandled: true,
  onDrop: (files: File[] | null) => selectFile(files?.[0]),
});

const rootClass = computed(() => cn(
  "image-cropper-theme image-cropper-dropzone",
  { "image-cropper-dropzone--over": isOverDropZone.value && !props.disabled },
  props.class,
));

function handleChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  // Reset before emitting, because the parent may unmount this input after selection.
  input.value = "";
  selectFile(file);
}
</script>

<template>
  <label
    ref="dropzone-ref"
    :for="inputId"
    :class="rootClass"
    :aria-disabled="props.disabled"
  >
    <!-- A real file input provides keyboard and mobile access alongside drag and drop. -->
    <input
      :id="inputId"
      class="image-cropper-visually-hidden"
      type="file"
      :accept="acceptAttribute"
      :disabled="props.disabled"
      :aria-labelledby="`${inputId}-label`"
      :aria-describedby="`${inputId}-description`"
      @change="handleChange"
    >
    <ImagePlusIcon class="image-cropper-dropzone__icon" />
    <span :id="`${inputId}-label`" class="image-cropper-dropzone__label">
      <slot name="label">Choose an image or drop it here</slot>
    </span>
    <span :id="`${inputId}-description`" class="image-cropper-dropzone__description">
      <slot name="description">{{ description }}</slot>
    </span>
  </label>
</template>
