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
} from "../types/image-cropper.types.ts";
import {
  canvasToBlob,
  canvasToDataUrl,
  getExportDimensions,
  resizeCanvas,
} from "../utils/canvas.utils.ts";
import { getSafeImageFileName } from "../utils/image-validation.utils.ts";
import { cn } from "../utils/cn.utils.ts";

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
  empty(): any;

  zoomOut(props: { disabled: boolean; zoomOut: () => void }): any;
  zoomIn(props: { disabled: boolean; zoomIn: () => void }): any;
  rotateLeft(props: { disabled: boolean; rotateLeft: () => void }): any;
  rotateRight(props: { disabled: boolean; rotateRight: () => void }): any;
  reset(props: { disabled: boolean; reset: () => void }): any;
  cancel(props: { disabled: boolean; cancel: () => void }): any;
  confirm(props: {
    disabled: boolean;
    loading: boolean;
    confirm: () => void;
  }): any;
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
const slots = defineSlots<ImageCropperSlots>();

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
    options.fileName ??
    props.outputFileName ??
    getSafeImageFileName(props.sourceFile?.name, mimeType, "cropped-image");

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
  } catch {
    emit("error", {
      code: "export-error",
      message: "Something went wrong while exporting the cropped image.",
    });
  } finally {
    isExporting.value = false;
  }
}

const rootClass = computed(() => {
  return cn("grid w-full gap-4", props.class);
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
    <div
      ref="stage-ref"
      :class="[
        $style['image-cropper__stage'],
        'relative min-h-90 w-full overflow-hidden rounded-2xl',
      ]"
    >
      <Cropper
        ref="cropper-ref"
        class="h-[min(70vh,32.5rem)] w-full"
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
      <div
        class="grid min-h-60 place-items-center rounded-2xl border border-dashed text-sm text-muted"
      >
        No image selected.
      </div>
    </slot>

    <div
      v-if="props.showControls"
      class="flex flex-wrap items-center justify-between gap-3"
    >
      <div class="flex flex-wrap gap-2">
        <!-- zoom out -->
        <slot
          v-if="resolvedControls.zoomOut"
          name="zoomOut"
          :disabled="disabledWithNoImage"
          :zoomOut="zoomOut"
        >
          <UButton
            size="sm"
            color="neutral"
            variant="soft"
            icon="i-lucide-zoom-out"
            :disabled="disabledWithNoImage"
            @click="zoomOut"
          />
        </slot>

        <!-- zoom in -->
        <slot
          v-if="resolvedControls.zoomIn"
          name="zoomIn"
          :disabled="disabledWithNoImage"
          :zoomIn="zoomIn"
        >
          <UButton
            size="sm"
            color="neutral"
            variant="soft"
            icon="i-lucide-zoom-in"
            :disabled="disabledWithNoImage"
            @click="zoomIn"
          />
        </slot>

        <!-- rotate left -->
        <slot
          v-if="resolvedControls.rotateLeft"
          name="rotateLeft"
          :disabled="disabledWithNoImage"
          :rotateLeft="rotateLeft"
        >
          <UButton
            size="sm"
            color="neutral"
            variant="soft"
            icon="i-lucide-rotate-ccw"
            :disabled="disabledWithNoImage"
            @click="rotateLeft"
          />
        </slot>

        <!-- rotate right -->
        <slot
          v-if="resolvedControls.rotateRight"
          name="rotateRight"
          :disabled="disabledWithNoImage"
          :rotateRight="rotateRight"
        >
          <UButton
            size="sm"
            color="neutral"
            variant="soft"
            icon="i-lucide-rotate-cw"
            :disabled="disabledWithNoImage"
            @click="rotateRight"
          />
        </slot>

        <!-- reset -->
        <slot
          v-if="resolvedControls.reset"
          name="reset"
          :disabled="disabledWithNoImage"
          :reset="reset"
        >
          <UButton
            size="sm"
            color="neutral"
            variant="soft"
            icon="i-lucide-refresh-cw"
            :label="labels.reset"
            :disabled="disabledWithNoImage"
            @click="reset"
          />
        </slot>

        <!-- cancel -->
        <slot
          v-if="resolvedControls.cancel"
          name="cancel"
          :disabled="props.disabled || isExporting"
          :cancel="cancel"
        >
          <UButton
            size="sm"
            color="neutral"
            variant="ghost"
            :label="labels.cancel"
            :disabled="props.disabled || isExporting"
            @click="cancel"
          />
        </slot>

        <!-- confirm -->
        <slot
          v-if="resolvedControls.confirm"
          name="confirm"
          :disabled="disabledWithNoImage"
          :loading="isExporting"
          :confirm="confirm"
        >
          <UButton
            size="sm"
            color="primary"
            :label="labels.confirm"
            :loading="isExporting"
            :disabled="disabledWithNoImage"
            @click="confirm"
          />
        </slot>
      </div>
    </div>
  </div>
</template>

<style lang="css" module>
.image-cropper__stage {
  background:
    linear-gradient(45deg, rgba(127, 127, 127, 0.08) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(127, 127, 127, 0.08) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(127, 127, 127, 0.08) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(127, 127, 127, 0.08) 75%);
  background-position:
    0 0,
    0 0.5rem,
    0.5rem -0.5rem,
    -0.5rem 0;
  background-size: 1rem 1rem;
}
</style>
