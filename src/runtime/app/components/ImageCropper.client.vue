<script setup lang="ts">
import {
  type HTMLAttributes,
  computed,
  nextTick,
  shallowRef,
  useTemplateRef,
  watch,
} from "vue";
import { Cropper } from "vue-advanced-cropper";
import { useResizeObserver } from "#imports";
import type {
  ImageCropperAspectRatio,
  ImageCropperControlKey,
  ImageCropperError,
  ImageCropperExportOptions,
  ImageCropperImageInfo,
  ImageCropperOutputMimeType,
  ImageCropperResult,
} from "../types/image-cropper.types";
import {
  canvasToBlob,
  canvasToDataUrl,
  getExportDimensions,
  resizeCanvas,
} from "../utils/canvas.utils";
import { getSafeImageFileName } from "../utils/image-validation.utils";
import { cn } from "../utils/cn.utils";
import ZoomOutIcon from "./icons/ZoomOutIcon.vue";
import ZoomInIcon from "./icons/ZoomInIcon.vue";
import RotateLeftIcon from "./icons/RotateLeftIcon.vue";
import RotateRightIcon from "./icons/RotateRightIcon.vue";
import ResetIcon from "./icons/ResetIcon.vue";

type CropperInstance = InstanceType<typeof Cropper> & {
  getResult: () => {
    coordinates: ImageCropperResult["coordinates"];
    image: ImageCropperImageInfo | null;
    visibleArea: unknown;
    canvas: HTMLCanvasElement | null;
  };
  refresh: () => void;
  zoom: (factor: number) => void;
  rotate: (angle: number) => void;
  reset: () => void;
};

interface ImageCropperProps {
  src: string | null;
  sourceFile?: File | null;
  aspectRatio?: ImageCropperAspectRatio;
  outputWidth?: number;
  outputHeight?: number;
  outputMimeType?: ImageCropperOutputMimeType;
  outputQuality?: number;
  outputFileName?: string;
  minWidth?: number;
  minHeight?: number;
  disabled?: boolean;
  showControls?: boolean;
  controls?: Partial<Record<ImageCropperControlKey, boolean>>;
  class?: HTMLAttributes["class"];
}

interface ImageCropperEmits {
  confirm: [result: ImageCropperResult];
  cancel: [];
  error: [error: ImageCropperError];
  ready: [];
  change: [result: Partial<ImageCropperResult>];
}

interface ImageCropperSlots {
  empty(): unknown;

  zoomOut(props: { disabled: boolean; zoomOut: () => void }): unknown;
  zoomIn(props: { disabled: boolean; zoomIn: () => void }): unknown;
  rotateLeft(props: { disabled: boolean; rotateLeft: () => void }): unknown;
  rotateRight(props: { disabled: boolean; rotateRight: () => void }): unknown;
  reset(props: { disabled: boolean; reset: () => void }): unknown;
  cancel(props: { disabled: boolean; cancel: () => void }): unknown;
  confirm(props: {
    disabled: boolean;
    loading: boolean;
    confirm: () => void;
  }): unknown;
}

const props = withDefaults(defineProps<ImageCropperProps>(), {
  sourceFile: null,
  aspectRatio: 1,
  outputWidth: 512,
  outputHeight: 512,
  outputMimeType: "image/webp",
  outputQuality: 0.9,
  minWidth: 64,
  minHeight: 64,
  disabled: false,
  showControls: true,
});
const emit = defineEmits<ImageCropperEmits>();
defineSlots<ImageCropperSlots>();

const labels = {
  cancel: "Cancel",
  reset: "Reset",
  confirm: "Confirm",
};

const cropperEl = useTemplateRef<CropperInstance>("cropper-ref");
const stageEl = useTemplateRef<HTMLDivElement>("stage-ref");

const isExporting = shallowRef(false);

const defaultControls: Record<ImageCropperControlKey, boolean> = {
  zoomIn: true,
  zoomOut: true,
  rotateLeft: true,
  rotateRight: true,
  reset: true,
  cancel: true,
  confirm: true,
};

const resolvedControls = computed(() => ({
  ...defaultControls,
  ...(props.controls ?? {}),
}));

const stencilProps = computed(() => {
  if (props.aspectRatio === "free") {
    return {
      movable: true,
      resizable: true,
    };
  }

  return {
    aspectRatio: props.aspectRatio,
    movable: true,
    resizable: true,
  };
});

const hasImage = computed(() => Boolean(props.src));
const disabledWithNoImage = computed(() => props.disabled || !hasImage.value);

function defaultSize({
  imageSize,
  visibleArea,
}: {
  imageSize: { width: number; height: number };
  visibleArea?: { width: number; height: number } | null;
}): { width: number; height: number } {
  return {
    width: (visibleArea || imageSize).width,
    height: (visibleArea || imageSize).height,
  };
}

function zoomIn(): void {
  cropperEl.value?.zoom(1.1);
}

function zoomOut(): void {
  cropperEl.value?.zoom(0.9);
}

function rotateLeft(): void {
  cropperEl.value?.rotate(-90);
}

function rotateRight(): void {
  cropperEl.value?.rotate(90);
}

function reset(): void {
  cropperEl.value?.reset();
}

function cancel(): void {
  emit("cancel");
}

function handleReady(): void {
  emit("ready");
}

function handleError(): void {
  emit("error", {
    code: "image-load-error",
    message:
      "The image could not be loaded. Try another format or convert it to JPEG/WebP.",
  });
}

function handleChange(payload: {
  coordinates: ImageCropperResult["coordinates"];
  image: ImageCropperImageInfo | null;
  canvas: HTMLCanvasElement | null;
}): void {
  emit("change", {
    coordinates: payload.coordinates,
    image: payload.image,
    width: payload.canvas?.width ?? 0,
    height: payload.canvas?.height ?? 0,
    mimeType: props.outputMimeType,
  });
}

async function exportImage(
  options: ImageCropperExportOptions = {},
): Promise<ImageCropperResult | null> {
  const result = cropperEl.value?.getResult();

  if (!result?.canvas) {
    const error: ImageCropperError = {
      code: "missing-canvas",
      message: "Could not export the cropped image.",
    };

    emit("error", error);
    return null;
  }

  const mimeType = options.mimeType ?? props.outputMimeType;
  const quality = options.quality ?? props.outputQuality;
  const dimensions = getExportDimensions(result.canvas, {
    width: options.width ?? props.outputWidth,
    height: options.height ?? props.outputHeight,
  });

  const outputCanvas = resizeCanvas(
    result.canvas,
    dimensions.width,
    dimensions.height,
  );
  const blob = await canvasToBlob(outputCanvas, mimeType, quality);
  const dataUrl = canvasToDataUrl(outputCanvas, mimeType, quality);

  const fileName =
    options.fileName
    ?? props.outputFileName
    ?? getSafeImageFileName(props.sourceFile?.name, mimeType, "cropped-image");

  const file = new File([blob], fileName, {
    type: mimeType,
    lastModified: Date.now(),
  });

  return {
    file,
    blob,
    dataUrl,
    coordinates: result.coordinates,
    image: result.image,
    width: outputCanvas.width,
    height: outputCanvas.height,
    mimeType,
  };
}

async function confirm(): Promise<void> {
  if (props.disabled || isExporting.value) return;

  try {
    isExporting.value = true;

    const result = await exportImage();

    if (result) {
      emit("confirm", result);
    }
  }
  catch {
    emit("error", {
      code: "export-error",
      message: "Something went wrong while exporting the cropped image.",
    });
  }
  finally {
    isExporting.value = false;
  }
}

// Keep consumer classes while owning the component's framework-independent layout.
const rootClass = computed(() => {
  return cn("image-cropper-theme image-cropper", props.class);
});

useResizeObserver(stageEl, () => {
  cropperEl.value?.refresh();
});

watch(
  () => props.src,
  async (nextSrc) => {
    if (!nextSrc) return;

    await nextTick();
    cropperEl.value?.refresh();
  },
);

defineExpose({
  exportImage,
  zoomIn,
  zoomOut,
  rotateLeft,
  rotateRight,
  reset,
  confirm,
});
</script>

<template>
  <div :class="rootClass">
    <!-- The cropper engine continues to own all image gestures and canvas work. -->
    <div ref="stage-ref" class="image-cropper__stage">
      <Cropper
        ref="cropper-ref"
        class="image-cropper__canvas"
        :src="props.src"
        :default-size="defaultSize"
        :stencil-props="stencilProps"
        :min-width="props.minWidth"
        :min-height="props.minHeight"
        :canvas="true"
        :check-orientation="true"
        image-restriction="fit-area"
        :auto-zoom="true"
        @ready="handleReady"
        @error="handleError"
        @change="handleChange"
      />
    </div>

    <slot v-if="!hasImage" name="empty">
      <div class="image-cropper__empty">
        No image selected.
      </div>
    </slot>

    <!-- Existing slots still allow consumers to supply their own controls. -->
    <div v-if="props.showControls" class="image-cropper__controls">
      <slot
        v-if="resolvedControls.zoomOut"
        name="zoomOut"
        :disabled="disabledWithNoImage"
        :zoom-out="zoomOut"
      >
        <button
          type="button"
          class="image-cropper-button"
          aria-label="Zoom out"
          :disabled="disabledWithNoImage"
          @click="zoomOut"
        >
          <ZoomOutIcon />
        </button>
      </slot>
      <slot
        v-if="resolvedControls.zoomIn"
        name="zoomIn"
        :disabled="disabledWithNoImage"
        :zoom-in="zoomIn"
      >
        <button
          type="button"
          class="image-cropper-button"
          aria-label="Zoom in"
          :disabled="disabledWithNoImage"
          @click="zoomIn"
        >
          <ZoomInIcon />
        </button>
      </slot>
      <slot
        v-if="resolvedControls.rotateLeft"
        name="rotateLeft"
        :disabled="disabledWithNoImage"
        :rotate-left="rotateLeft"
      >
        <button
          type="button"
          class="image-cropper-button"
          aria-label="Rotate left"
          :disabled="disabledWithNoImage"
          @click="rotateLeft"
        >
          <RotateLeftIcon />
        </button>
      </slot>
      <slot
        v-if="resolvedControls.rotateRight"
        name="rotateRight"
        :disabled="disabledWithNoImage"
        :rotate-right="rotateRight"
      >
        <button
          type="button"
          class="image-cropper-button"
          aria-label="Rotate right"
          :disabled="disabledWithNoImage"
          @click="rotateRight"
        >
          <RotateRightIcon />
        </button>
      </slot>
      <slot
        v-if="resolvedControls.reset"
        name="reset"
        :disabled="disabledWithNoImage"
        :reset="reset"
      >
        <button
          type="button"
          class="image-cropper-button"
          :disabled="disabledWithNoImage"
          @click="reset"
        >
          <ResetIcon />{{ labels.reset }}
        </button>
      </slot>
      <slot
        v-if="resolvedControls.cancel"
        name="cancel"
        :disabled="props.disabled || isExporting"
        :cancel="cancel"
      >
        <button
          type="button"
          class="image-cropper-button image-cropper-button--ghost"
          :disabled="props.disabled || isExporting"
          @click="cancel"
        >
          {{ labels.cancel }}
        </button>
      </slot>
      <slot
        v-if="resolvedControls.confirm"
        name="confirm"
        :disabled="disabledWithNoImage"
        :loading="isExporting"
        :confirm="confirm"
      >
        <button
          type="button"
          class="image-cropper-button image-cropper-button--primary"
          :aria-busy="isExporting"
          :disabled="disabledWithNoImage || isExporting"
          @click="confirm"
        >
          <span v-if="isExporting" class="image-cropper-spinner" aria-hidden="true" />
          {{ labels.confirm }}
        </button>
      </slot>
    </div>
  </div>
</template>
