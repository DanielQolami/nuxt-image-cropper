import type {
  ImageCropperError,
  ImageCropperMimeType,
  ImageCropperValidationOptions,
} from "../types/image-cropper.types";

const DEFAULT_IMAGE_CROPPER_MAX_SIZE = 5 * 1024 * 1024;

const DEFAULT_IMAGE_CROPPER_ACCEPT = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const satisfies readonly ImageCropperMimeType[];

function validateImageFile(
  file: File | null | undefined,
  options: ImageCropperValidationOptions = {},
): ImageCropperError | null {
  if (!file) {
    return {
      code: "missing-file",
      message: "Please choose an image file.",
    };
  }

  const maxSize = options.maxSize ?? DEFAULT_IMAGE_CROPPER_MAX_SIZE;
  const accept = options.accept ?? DEFAULT_IMAGE_CROPPER_ACCEPT;

  if (!accept.includes(file.type as ImageCropperMimeType)) {
    return {
      code: "invalid-file-type",
      message: `Unsupported image type. Please choose ${accept
        .map(type => type.replace("image/", "").toUpperCase())
        .join(", ")}.`,
    };
  }

  if (file.size > maxSize) {
    return {
      code: "file-too-large",
      message: `Image is too large. Maximum size is ${formatBytes(maxSize)}.`,
    };
  }

  return null;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, index);

  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function getSafeImageFileName(
  originalName: string | undefined,
  mimeType: string,
  fallback = "cropped-image",
): string {
  const extension = mimeType.split("/")[1] || "webp";
  const baseName = originalName
    ?.replace(/\.[^.]+$/, "")
    // @eslint-ignore
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return `${baseName || fallback}.${extension === "jpeg" ? "jpg" : extension}`;
}

export {
  DEFAULT_IMAGE_CROPPER_MAX_SIZE,
  DEFAULT_IMAGE_CROPPER_ACCEPT,
  validateImageFile,
  formatBytes,
  getSafeImageFileName,
};
