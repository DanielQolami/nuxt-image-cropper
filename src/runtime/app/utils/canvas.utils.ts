import type {
  ImageCropperExportOptions,
  ImageCropperOutputMimeType,
} from "../types/image-cropper.types.ts";

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: ImageCropperOutputMimeType,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas export failed."));
          return;
        }

        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}

function resizeCanvas(source: HTMLCanvasElement, width: number, height: number): HTMLCanvasElement {
  if (source.width === width && source.height === height) {
    return source;
  }

  const target = document.createElement("canvas");
  target.width = width;
  target.height = height;

  const context = target.getContext("2d");

  if (!context) {
    throw new Error("Could not create canvas context.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, width, height);

  return target;
}

function canvasToDataUrl(
  canvas: HTMLCanvasElement,
  mimeType: ImageCropperOutputMimeType,
  quality: number,
): string {
  return canvas.toDataURL(mimeType, quality);
}

function getExportDimensions(
  canvas: HTMLCanvasElement,
  options: Pick<ImageCropperExportOptions, "width" | "height">,
): { width: number; height: number } {
  if (options.width && options.height) {
    return {
      width: options.width,
      height: options.height,
    };
  }

  if (options.width && !options.height) {
    const ratio = canvas.height / canvas.width;

    return {
      width: options.width,
      height: Math.round(options.width * ratio),
    };
  }

  if (!options.width && options.height) {
    const ratio = canvas.width / canvas.height;

    return {
      width: Math.round(options.height * ratio),
      height: options.height,
    };
  }

  return {
    width: canvas.width,
    height: canvas.height,
  };
}

export { canvasToBlob, resizeCanvas, canvasToDataUrl, getExportDimensions };
