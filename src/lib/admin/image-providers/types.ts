export type ImageSize = { width: number; height: number };

export type ImageGenerateSuccess = {
  buffer: Buffer;
  mimeType: string;
  provider: string;
  /** Chemin public si l’image vient de la bibliothèque (pas de buffer upload). */
  publicPath?: string;
};

export type ImageGenerateFailure = {
  error: string;
};

export type ImageGenerateResult = ImageGenerateSuccess | ImageGenerateFailure;

export interface ImageProvider {
  name: string;
  isAvailable(): Promise<boolean> | boolean;
  generate(
    prompt: string,
    size: ImageSize,
    opts?: { referenceImageBase64?: string; referenceMimeType?: string },
  ): Promise<ImageGenerateResult>;
}

export function isImageGenerateSuccess(result: ImageGenerateResult): result is ImageGenerateSuccess {
  return 'buffer' in result && Buffer.isBuffer(result.buffer);
}
