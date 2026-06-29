import { computed, readonly, shallowRef, watch } from "vue";
import { useObjectUrl } from "#imports";
import type {
  ImageCropperError,
  ImageCropperValidationOptions,
} from "../types/image-cropper.types.ts";
import { validateImageFile } from "../utils/image-validation.utils.ts";

function useImageCropperFile(options: ImageCropperValidationOptions = {}) {
  const file = shallowRef<File | null>(null);
  // Vueuse: @see https://vueuse.org/core/useObjectUrl/
  const rawSrc = useObjectUrl(file);
  const error = shallowRef<ImageCropperError | null>(null);

  const src = computed(() => rawSrc.value ?? null);
  const hasFile = computed(() => Boolean(file.value && src.value));

  function setFile(nextFile: File | null | undefined): boolean {
    file.value = null;
    error.value = null;

    const validationError = validateImageFile(nextFile, options);

    if (validationError) {
      error.value = validationError;
      return false;
    }

    file.value = nextFile ?? null;

    return true;
  }

  function clear(): void {
    file.value = null;
    error.value = null;
  }

  watch(
    () => options.maxSize,
    () => {
      if (!file.value) return;

      const validationError = validateImageFile(file.value, options);

      if (validationError) {
        clear();
        error.value = validationError;
      }
    },
  );

  return {
    file: readonly(file),
    src: readonly(src),
    error: readonly(error),
    hasFile,
    setFile,
    clear,
  };
}

export { useImageCropperFile };
