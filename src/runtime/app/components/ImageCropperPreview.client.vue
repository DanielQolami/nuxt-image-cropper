<script setup lang="ts">
import { type HTMLAttributes, computed } from "vue";
import { cn } from "../utils/cn.utils";

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
  if (props.shape === "circle") return "rounded-full";
  if (props.shape === "rounded") return "rounded-2xl";

  return "rounded-none";
});

const rootClass = computed(() =>
  cn(
    "grid place-items-center overflow-hidden border bg-muted",
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
      class="size-full object-cover"
    >

    <UIcon v-else name="i-lucide-user" class="text-2xl text-muted" />
  </div>
</template>
