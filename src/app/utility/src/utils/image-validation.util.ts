export class ImageValidationUtil {
  static readonly ACCEPTED_FILE_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/svg+xml",
    "image/bmp",
    "image/tiff",
  ];

  static readonly ACCEPTED_FILE_EXTENSIONS =
    /.*\.(jpg|jpeg|png|gif|svg|bmp|tiff)$/i;

  static readonly REQUIRED_ASPECT_RATIO = 16 / 9;
  static readonly ASPECT_RATIO_TOLERANCE = 0.01;

  static readonly VALID_RESOLUTIONS = [
    { width: 1920, height: 1080 },
    { width: 3840, height: 2160 },
  ];

  static isValidFileType(file: File): boolean {
    const isValidType = this.ACCEPTED_FILE_TYPES.includes(file.type);
    const isValidName = this.ACCEPTED_FILE_EXTENSIONS.test(file.name);
    return isValidType && isValidName;
  }

  static isValidFileSize(file: File, maxSizeInMB: number = 10): boolean {
    const maxSize = maxSizeInMB * 1024 * 1024;
    return file.size <= maxSize;
  }

  static isValidFileName(file: File, maxLength: number = 255): boolean {
    return file.name.length <= maxLength;
  }

  static validateImageDimensions(file: File): Promise<ImageValidationResult> {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      img.onload = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;

        // Check if resolution is exactly one of the required ones
        const isValidResolution = this.VALID_RESOLUTIONS.some(
          (resolution) =>
            resolution.width === width && resolution.height === height
        );

        if (isValidResolution) {
          resolve({
            isValid: true,
            width,
            height,
            aspectRatio: width / height,
            message: `Valid resolution: ${width}x${height}`,
          });
          return;
        }

        const aspectRatio = width / height;
        const isValidAspectRatio =
          Math.abs(aspectRatio - this.REQUIRED_ASPECT_RATIO) <=
          this.ASPECT_RATIO_TOLERANCE;

        if (!isValidAspectRatio) {
          resolve({
            isValid: false,
            width,
            height,
            aspectRatio,
            message: `Invalid aspect ratio. Image has ${aspectRatio.toFixed(2)}:1, but 16:9 (${this.REQUIRED_ASPECT_RATIO.toFixed(2)}:1) is required. Valid resolutions: ${this.VALID_RESOLUTIONS.map((r) => `${r.width}x${r.height}`).join(", ")}`,
          });
          return;
        }

        resolve({
          isValid: false,
          width,
          height,
          aspectRatio,
          message: `Invalid resolution: ${width}x${height}. Valid resolutions for 16:9 aspect ratio: ${this.VALID_RESOLUTIONS.map((r) => `${r.width}x${r.height}`).join(", ")}`,
        });
      };

      img.onerror = () => {
        resolve({
          isValid: false,
          width: 0,
          height: 0,
          aspectRatio: 0,
          message: "Unable to load image for validation",
        });
      };

      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;

      const originalOnload = img.onload;
      img.onload = function (ev: Event) {
        URL.revokeObjectURL(objectUrl);
        return originalOnload?.call(this, ev);
      };

      const originalOnError = img.onerror;
      img.onerror = function (ev: Event | string) {
        URL.revokeObjectURL(objectUrl);
        return originalOnError?.call(this, ev);
      };
    });
  }

  static async validateImageFile(
    file: File,
    maxSizeInMB: number = 10,
    maxNameLength: number = 255
  ): Promise<FileValidationResult> {
    // Basic validations
    if (!this.isValidFileType(file)) {
      return {
        isValid: false,
        errors: [
          `File "${file.name}" is invalid. Only images in JPG, PNG, GIF, SVG, BMP, and TIFF formats are allowed.`,
        ],
      };
    }

    if (!this.isValidFileSize(file, maxSizeInMB)) {
      return {
        isValid: false,
        errors: [`File "${file.name}" must be at most ${maxSizeInMB}MB.`],
      };
    }

    if (!this.isValidFileName(file, maxNameLength)) {
      return {
        isValid: false,
        errors: [
          `File name "${file.name}" is too long. Maximum of ${maxNameLength} characters allowed.`,
        ],
      };
    }

    try {
      const dimensionResult = await this.validateImageDimensions(file);

      if (!dimensionResult.isValid) {
        return {
          isValid: false,
          errors: [dimensionResult.message],
          imageValidation: dimensionResult,
        };
      }

      return {
        isValid: true,
        errors: [],
        imageValidation: dimensionResult,
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ["Error validating image dimensions"],
      };
    }
  }

  static getFileType(file: File): string {
    const extension = file.name.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "gif":
        return "image/gif";
      case "svg":
        return "image/svg+xml";
      case "bmp":
        return "image/bmp";
      case "tiff":
        return "image/tiff";
      default:
        return "image/jpeg";
    }
  }
}

export interface ImageValidationResult {
  isValid: boolean;
  width: number;
  height: number;
  aspectRatio: number;
  message: string;
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  imageValidation?: ImageValidationResult;
}
