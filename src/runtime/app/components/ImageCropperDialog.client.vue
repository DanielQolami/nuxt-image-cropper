<script setup lang="ts">
import { computed, onBeforeUnmount, shallowRef, useId, useTemplateRef, watch } from "vue";
import type {
  ImageCropperAspectRatio,
  ImageCropperControlKey,
  ImageCropperError,
  ImageCropperMimeType,
  ImageCropperOutputMimeType,
  ImageCropperPreset,
  ImageCropperResult,
} from "../types/image-cropper.types";
import {
  DEFAULT_IMAGE_CROPPER_ACCEPT,
  DEFAULT_IMAGE_CROPPER_MAX_SIZE,
} from "../utils/image-validation.utils";
import { useImageCropperFile } from "../composables/useImageCropperFile";
import ImageCropper from "./ImageCropper.client.vue";
import ImageCropperDropzone from "./ImageCropperDropzone.client.vue";
import AlertIcon from "./icons/AlertIcon.vue";
import CloseIcon from "./icons/CloseIcon.vue";
import { lockDialogScroll } from "../utils/dialog-scroll-lock.utils";

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
// Native modal state is synchronized after Vue has attached the dialog element.
const dialogEl = useTemplateRef<HTMLDialogElement>("dialog-ref");
const dialogId = useId();
const isSaving = shallowRef(false);
const isReady = shallowRef(false);
const saveDisabled = computed(() => !src.value || !isReady.value || isSaving.value);
let previousFocus: HTMLElement | null = null;
let releaseScroll: (() => void) | undefined;
let exportGeneration = 0;

const {
  file: selectedFile,
  src,
  error: fileError,
  setFile,
  clear,
} = useImageCropperFile({
  get maxSize() { return props.maxSize; },
  get accept() { return props.accept; },
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

// The dialog owns its footer actions, including when consumers enable all controls.
const resolvedControls = computed(() => ({
  ...props.controls,
  cancel: false,
  confirm: false,
}));

// Reapply an unchanged supplied file when the dialog is reopened after cleanup.
watch(
  [() => props.file, open],
  ([nextFile, isOpen]) => {
    if (isOpen && nextFile) handleSelect(nextFile);
  },
  { immediate: true },
);

// Closing invalidates pending exports before a later open can start another session.
watch(open, (isOpen) => {
  if (isOpen) return;
  exportGeneration++;
  isSaving.value = false;
  isReady.value = false;
  clear();
  lastError.value = null;
}, { flush: "sync" });

/** Releases only this dialog's scroll lock and returns focus to its opener. */
function restorePage(): void {
  releaseScroll?.();
  releaseScroll = undefined;
  if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  previousFocus = null;
}

watch([open, dialogEl], ([isOpen, dialog]) => {
  if (!dialog) return;

  if (isOpen && !dialog.open) {
    const activeElement = dialog.ownerDocument.activeElement;
    previousFocus = activeElement instanceof HTMLElement ? activeElement : null;
    dialog.showModal();
    releaseScroll = lockDialogScroll(dialog.ownerDocument);
  }
  else if (!isOpen && dialog.open) {
    dialog.close();
    restorePage();
  }
}, { immediate: true, flush: "post" });

// A delayed native close event must not close a dialog that has already reopened.
function handleClose(): void {
  if (dialogEl.value?.open) return;
  open.value = false;
  restorePage();
}

function dismiss(): void {
  open.value = false;
}

// Only a complete backdrop gesture dismisses; dragging out from the content does not.
let startedOnBackdrop = false;
function isBackdrop(event: PointerEvent): boolean {
  const dialog = dialogEl.value;
  if (!dialog || event.target !== dialog) return false;
  const bounds = dialog.getBoundingClientRect();
  return event.clientX < bounds.left || event.clientX > bounds.right
    || event.clientY < bounds.top || event.clientY > bounds.bottom;
}

function handlePointerDown(event: PointerEvent): void {
  startedOnBackdrop = isBackdrop(event);
}

function handlePointerUp(event: PointerEvent): void {
  if (startedOnBackdrop && isBackdrop(event)) dismiss();
  startedOnBackdrop = false;
}

onBeforeUnmount(() => {
  exportGeneration++;
  dialogEl.value?.close();
  clear();
  restorePage();
});

function handleSelect(file: File): void {
  lastError.value = null;
  isReady.value = false;
  if (!setFile(file) && fileError.value) handleError(fileError.value);
}

function handleError(error: ImageCropperError): void {
  lastError.value = error;
  emit("error", error);
}

function handleCancel(): void {
  emit("cancel");
  dismiss();
}

async function handleConfirm(): Promise<void> {
  if (saveDisabled.value) return;
  const generation = exportGeneration;
  isSaving.value = true;

  try {
    const result = await cropperEl.value?.exportImage({
      width: resolvedOutputWidth.value,
      height: resolvedOutputHeight.value,
      mimeType: props.outputMimeType,
      quality: props.outputQuality,
    });

    // Cancelling or unmounting while canvas encoding runs discards the late result.
    if (!result || generation !== exportGeneration) return;
    emit("confirm", result);
    dismiss();
  }
  catch {
    if (generation === exportGeneration) {
      handleError({ code: "export-error", message: "Something went wrong while exporting the cropped image." });
    }
  }
  finally {
    if (generation === exportGeneration) isSaving.value = false;
  }
}
</script>

<template>
  <dialog
    ref="dialog-ref"
    class="image-cropper-theme image-cropper-dialog"
    :aria-labelledby="`${dialogId}-title`"
    :aria-describedby="`${dialogId}-description`"
    @cancel.prevent="dismiss"
    @close="handleClose"
    @pointerdown="handlePointerDown"
    @pointerup="handlePointerUp"
  >
    <!-- showModal supplies native modality; the model remains the consumer's source of truth. -->
    <header class="image-cropper-dialog__header">
      <div>
        <h2 :id="`${dialogId}-title`" class="image-cropper-dialog__title">
          <slot name="title">
            Crop image
          </slot>
        </h2>
        <p :id="`${dialogId}-description`" class="image-cropper-dialog__description">
          <slot name="description">
            Adjust the image before saving.
          </slot>
        </p>
      </div>
      <button
        type="button"
        class="image-cropper-button image-cropper-button--ghost"
        aria-label="Close dialog"
        autofocus
        @click="dismiss"
      >
        <CloseIcon />
      </button>
    </header>

    <div class="image-cropper-dialog__body">
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
        @ready="isReady = true"
        @error="handleError"
      />
      <slot v-if="lastError" name="error" :error="lastError">
        <div class="image-cropper-alert" role="alert">
          <AlertIcon />
          <span>{{ lastError.message }}</span>
        </div>
      </slot>
    </div>

    <footer class="image-cropper-dialog__footer">
      <slot name="cancel" :disabled="false" :cancel="handleCancel">
        <button type="button" class="image-cropper-button image-cropper-button--ghost" @click="handleCancel">
          Cancel
        </button>
      </slot>
      <slot name="save" :disabled="saveDisabled" :save="handleConfirm">
        <button
          type="button"
          class="image-cropper-button image-cropper-button--primary"
          :disabled="saveDisabled"
          :aria-busy="isSaving"
          @click="handleConfirm"
        >
          <span v-if="isSaving" class="image-cropper-spinner" aria-hidden="true" />
          Save Crop
        </button>
      </slot>
    </footer>
  </dialog>
</template>
