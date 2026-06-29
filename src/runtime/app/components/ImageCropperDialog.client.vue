<script setup lang="ts">
import { defu } from "defu";
import { computed, shallowRef, useTemplateRef, watch } from "vue";
import type {
  ImageCropperAspectRatio,
  ImageCropperControlKey,
  ImageCropperError,
  ImageCropperMimeType,
  ImageCropperOutputMimeType,
  ImageCropperPreset,
  ImageCropperResult,
} from "../types/image-cropper.types.ts";
import {
  DEFAULT_IMAGE_CROPPER_ACCEPT,
  DEFAULT_IMAGE_CROPPER_MAX_SIZE,
} from "../utils/image-validation.utils.ts";
import { useImageCropperFile } from "../composables/useImageCropperFile.ts";
import type ImageCropper from "./ImageCropper.client.vue";

interface ImageCropperDialogProps {
  file?: File | null;
  preset?: ImageCropperPreset;
  aspectRatio?: ImageCropperAspectRatio;
  outputWidth?: number;
  outputHeight?: number;
  outputMimeType?: ImageCropperOutputMimeType;
  outputQuality?: number;
  /**
   *  Max Size in Bytes
   *
   * @example 5 * 1024 * 1024; // 5MB
   */
  maxSize?: number;
  accept?: readonly ImageCropperMimeType[];
  showControls?: boolean;
  controls?: Partial<Record<ImageCropperControlKey, boolean>>;
}

interface ImageCropperDialogEmits {
  confirm: [result: ImageCropperResult];
  cancel: [];
  error: [error: ImageCropperError];
}

interface ImageCropperDialogSlots {
  title(): unknown;
  description(): unknown;

  error(props: { error: ImageCropperError }): unknown;

  cancel(props: { disabled: boolean; cancel: () => void }): unknown;
  save(props: { disabled: boolean; save: () => void }): unknown;
}

const open = defineModel<boolean>("open", {
  default: false,
});

const props = withDefaults(defineProps<ImageCropperDialogProps>(), {
  file: null,
  preset: "avatar",
  outputMimeType: "image/webp",
  outputQuality: 0.9,
  maxSize: DEFAULT_IMAGE_CROPPER_MAX_SIZE,
  accept: () => DEFAULT_IMAGE_CROPPER_ACCEPT,
  showControls: true,
});
const emit = defineEmits<ImageCropperDialogEmits>();
defineSlots<ImageCropperDialogSlots>();

const cropperEl =
  useTemplateRef<InstanceType<typeof ImageCropper>>("cropper-ref");
const lastError = shallowRef<ImageCropperError | null>(null);

const {
  file: selectedFile,
  src,
  setFile,
  clear,
} = useImageCropperFile({
  maxSize: props.maxSize,
  accept: props.accept,
});

const resolvedAspectRatio = computed<ImageCropperAspectRatio>(() => {
  if (props.aspectRatio !== undefined) return props.aspectRatio;

  if (props.preset === "avatar") return 1;
  if (props.preset === "cover") return 16 / 9;

  return "free";
});

const resolvedOutputWidth = computed(() => {
  if (props.outputWidth) return props.outputWidth;
  if (props.preset === "cover") return 1280;

  return 512;
});

const resolvedOutputHeight = computed(() => {
  if (props.outputHeight) return props.outputHeight;
  if (props.preset === "cover") return 720;
  if (resolvedAspectRatio.value === "free") return undefined;

  return 512;
});

const resolvedControls = computed(() => {
  return defu(
    {
      cancel: false,
      confirm: false,
    } satisfies Partial<Record<ImageCropperControlKey, boolean>>,
    props.controls,
  );
});

watch(
  () => props.file,
  (nextFile) => {
    if (!nextFile) return;
    setFile(nextFile);
  },
  { immediate: true },
);

watch(open, (isOpen) => {
  if (isOpen) return;

  clear();
  lastError.value = null;
});

function handleSelect(file: File): void {
  lastError.value = null;
  setFile(file);
}

function handleError(error: ImageCropperError): void {
  lastError.value = error;
  emit("error", error);
}

function handleCancel(): void {
  emit("cancel");
  open.value = false;
}

async function handleConfirm(): Promise<void> {
  const result = await cropperEl.value?.exportImage({
    width: resolvedOutputWidth.value,
    height: resolvedOutputHeight.value,
    mimeType: props.outputMimeType,
    quality: props.outputQuality,
  });

  if (!result) return;

  emit("confirm", result);
  open.value = false;
}
</script>

<template>
  <UModal v-model:open="open" :dismissible="true">
    <template v-slot:title>
      <slot name="title">
        Crop image
      </slot>
    </template>
    <template v-slot:description>
      <slot name="description">
        Adjust the image before saving.
      </slot>
    </template>

    <template v-slot:body>
      <div class="grid gap-4">
        <ImageCropperDropzone
          v-if="!src"
          :accept="props.accept"
          :max-size="props.maxSize"
          @select="handleSelect"
          @error="handleError"
        />

        <ImageCropper
          v-else
          ref="cropper-ref"
          :src="src"
          :source-file="selectedFile"
          :aspect-ratio="resolvedAspectRatio"
          :output-width="resolvedOutputWidth"
          :output-height="resolvedOutputHeight"
          :output-mime-type="props.outputMimeType"
          :output-quality="props.outputQuality"
          :show-controls="props.showControls"
          :controls="resolvedControls"
          @error="handleError"
        />

        <slot v-if="lastError" name="error" :error="lastError">
          <UAlert
            color="error"
            variant="soft"
            icon="i-lucide-circle-alert"
            :title="lastError.message"
          />
        </slot>
      </div>
    </template>

    <template v-slot:footer>
      <div class="flex w-full gap-2 sm:justify-end">
        <!-- cancel -->
        <slot name="cancel" :disabled="false" :cancel="handleCancel">
          <UButton
            color="neutral"
            variant="ghost"
            label="Cancel"
            @click="handleCancel"
          />
        </slot>

        <!-- save -->
        <slot name="save" :disabled="!src" :save="handleConfirm">
          <UButton
            color="primary"
            label="Save Crop"
            :disabled="!src"
            @click="handleConfirm"
          />
        </slot>
      </div>
    </template>
  </UModal>
</template>
