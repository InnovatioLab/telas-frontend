import { Injectable } from '@angular/core';
import {
  FileValidationResult,
  ImageValidationUtil,
} from '@app/utility/src/utils/image-validation.util';

export type FileValidationMode = 'attachment' | 'creative';

export interface FileValidationOptions {
  mode?: FileValidationMode;
  maxSizeInMB?: number;
  maxNameLength?: number;
}

@Injectable({
  providedIn: 'root',
})
export class FileUploadPipelineService {
  validateFile(
    file: File,
    options: FileValidationOptions = {}
  ): Promise<FileValidationResult> {
    const {
      mode = 'creative',
      maxSizeInMB = 10,
      maxNameLength = 255,
    } = options;

    if (mode === 'attachment') {
      return this.validateAttachmentFile(file, maxSizeInMB, maxNameLength);
    }

    return ImageValidationUtil.validateImageFile(
      file,
      maxSizeInMB,
      maxNameLength
    );
  }

  readAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1] ?? '');
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  }

  getFileType(file: File): string {
    if (file.type) {
      return file.type;
    }
    return ImageValidationUtil.getFileType(file);
  }

  private validateAttachmentFile(
    file: File,
    maxSizeInMB: number,
    maxNameLength: number
  ): Promise<FileValidationResult> {
    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf && !ImageValidationUtil.isValidFileType(file)) {
      return Promise.resolve({
        isValid: false,
        errors: [
          `File "${file.name}" is invalid. Only images in JPG, PNG, GIF, SVG, BMP, TIFF formats or PDF files are allowed.`,
        ],
      });
    }

    if (isPdf && !/.*\.pdf$/i.test(file.name)) {
      return Promise.resolve({
        isValid: false,
        errors: [`File "${file.name}" is invalid. Only PDF files are allowed.`],
      });
    }

    if (!ImageValidationUtil.isValidFileSize(file, maxSizeInMB)) {
      return Promise.resolve({
        isValid: false,
        errors: [`File "${file.name}" must be at most ${maxSizeInMB}MB.`],
      });
    }

    if (!ImageValidationUtil.isValidFileName(file, maxNameLength)) {
      return Promise.resolve({
        isValid: false,
        errors: [
          `File name "${file.name}" is too long. Maximum of ${maxNameLength} characters allowed.`,
        ],
      });
    }

    return Promise.resolve({
      isValid: true,
      errors: [],
    });
  }
}
