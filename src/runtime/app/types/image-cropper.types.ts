type ImageCropperMimeType = "image/jpeg" | "image/png" | "image/webp" | "image/heic" | "image/heif";

type ImageCropperOutputMimeType = "image/jpeg" | "image/png" | "image/webp";

type ImageCropperAspectRatio = number | "free";

type ImageCropperPreset = "avatar" | "cover" | "free";

type ImageCropperControlKey =
  | "zoomIn"
  | "zoomOut"
  | "rotateLeft"
  | "rotateRight"
  | "reset"
  | "confirm"
  | "cancel";

interface ImageCropperCoordinates {
  width: number;
  height: number;
  left: number;
  top: number;
}

interface ImageCropperImageInfo {
  width: number;
  height: number;
  transforms?: {
    rotate?: number;
    flip?: {
      horizontal?: boolean;
      vertical?: boolean;
    };
  };
}

interface ImageCropperResult {
  file: File | null;
  blob: Blob | null;
  dataUrl: string | null;
  coordinates: ImageCropperCoordinates | null;
  image: ImageCropperImageInfo | null;
  width: number;
  height: number;
  mimeType: ImageCropperOutputMimeType;
}

interface ImageCropperValidationOptions {
  maxSize?: number;
  accept?: readonly ImageCropperMimeType[];
}

interface ImageCropperExportOptions {
  width?: number;
  height?: number;
  mimeType?: ImageCropperOutputMimeType;
  quality?: number;
  fileName?: string;
}

interface ImageCropperError {
  code:
    | "file-too-large"
    | "invalid-file-type"
    | "missing-file"
    | "missing-canvas"
    | "image-load-error"
    | "export-error";
  message: string;
}

export type {
  ImageCropperMimeType,
  ImageCropperOutputMimeType,
  ImageCropperAspectRatio,
  ImageCropperPreset,
  ImageCropperControlKey,
  ImageCropperCoordinates,
  ImageCropperImageInfo,
  ImageCropperResult,
  ImageCropperValidationOptions,
  ImageCropperExportOptions,
  ImageCropperError,
};
