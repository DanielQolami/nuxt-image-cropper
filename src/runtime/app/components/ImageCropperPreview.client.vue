<script setup lang="ts">
import { type HTMLAttributes, computed } from "vue";
import { cn } from "../utils/cn.utils";
import UserIcon from "./icons/UserIcon.vue";

interface ImageCropperPreviewProps {
  src: string | null;
  alt?: string;
  shape?: "square" | "circle" | "rounded";
  size?: number;
  class?: HTMLAttributes["class"];
}

const props = withDefaults(defineProps<ImageCropperPreviewProps>(), {
  alt: "Cropped image preview",
  shape: "circle",
  size: 96,
});

const previewShapeClass = computed(() => {
  if (props.shape === "circle") return "image-cropper-preview--circle";
  if (props.shape === "rounded") return "image-cropper-preview--rounded";

  return "image-cropper-preview--square";
});

const rootClass = computed(() =>
  cn(
    "image-cropper-theme image-cropper-preview",
    previewShapeClass.value,
    props.class,
  ),
);
</script>

<template>
  <div
    :class="rootClass"
    :style="{
      width: `${props.size}px`,
      height: `${props.size}px`,
    }"
  >
    <img
      v-if="props.src"
      :src="props.src"
      :alt="props.alt"
      class="image-cropper-preview__image"
    >

    <UserIcon v-else class="image-cropper-preview__placeholder" />
  </div>
</template>
