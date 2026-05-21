import { CommonModule } from "@angular/common";
import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { MonitorService } from "@app/core/service/api/monitor.service";
import { ToastService } from "@app/core/service/state/toast.service";
import { AttachmentRequestDto } from "@app/model/dto/request/attachment-request.dto";
import { Monitor } from "@app/model/monitors";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { isPdfFile } from "@app/shared/utils/file-type.utils";
import { ImageValidationUtil } from "@app/utility/src/utils/image-validation.util";

@Component({
  selector: "app-partner-screen-upload",
  standalone: true,
  imports: [CommonModule, PrimengModule],
  templateUrl: "./partner-screen-upload.component.html",
  styleUrls: ["./partner-screen-upload.component.scss"],
})
export class PartnerScreenUploadComponent implements OnInit {
  @ViewChild("fileInput") fileInput!: ElementRef<HTMLInputElement>;

  monitorId = "";
  screen: Monitor | null = null;
  loadingScreen = false;
  uploading = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  readonly maxFileSize = 10 * 1024 * 1024;
  readonly acceptedFileTypes = ".jpg,.jpeg,.png,.gif,.svg,.bmp,.tiff,.pdf";

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly monitorService: MonitorService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.monitorId = this.route.snapshot.paramMap.get("monitorId") ?? "";
    if (!this.monitorId) {
      void this.router.navigate(["/client/screens"]);
      return;
    }
    this.loadScreen();
  }

  loadScreen(): void {
    this.loadingScreen = true;
    this.monitorService.getPartnerScreens().subscribe({
      next: (screens) => {
        this.screen = screens.find((s) => s.id === this.monitorId) ?? null;
        this.loadingScreen = false;
        if (!this.screen) {
          this.toastService.aviso("Screen not found for your account");
          void this.router.navigate(["/client/screens"]);
        }
      },
      error: () => {
        this.loadingScreen = false;
        this.toastService.erro("Failed to load screen");
        void this.router.navigate(["/client/screens"]);
      },
    });
  }

  screenAddress(): string {
    if (!this.screen) {
      return "";
    }
    if (this.screen.fullAddress?.trim()) {
      return this.screen.fullAddress;
    }
    const addr = this.screen.address;
    if (!addr) {
      return "";
    }
    return [addr.street, addr.city, addr.state, addr.zipCode]
      .filter((part) => !!part?.trim())
      .join(", ");
  }

  goBack(): void {
    void this.router.navigate(["/client/screens"]);
  }

  chooseFile(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) {
      return;
    }
    if (file.size > this.maxFileSize) {
      this.toastService.erro("File must be at most 10MB");
      return;
    }

    const validate = isPdfFile(file.name)
      ? Promise.resolve({ isValid: true, errors: [] as string[] })
      : ImageValidationUtil.validateImageFile(file);

    validate
      .then((result) => {
        if (!result.isValid) {
          result.errors.forEach((msg) => this.toastService.erro(msg));
          return;
        }
        this.selectedFile = file;
        const reader = new FileReader();
        reader.onload = () => {
          this.previewUrl = reader.result as string;
        };
        reader.readAsDataURL(file);
      })
      .catch(() => this.toastService.erro("Could not validate file"));
  }

  isPdfPreview(): boolean {
    return !!this.selectedFile && isPdfFile(this.selectedFile.name);
  }

  upload(): void {
    if (!this.selectedFile || !this.monitorId) {
      this.toastService.aviso("Select a file to upload");
      return;
    }

    this.uploading = true;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1] ?? "";
      const payload: AttachmentRequestDto = {
        name: this.selectedFile!.name,
        type: this.getFileType(this.selectedFile!),
        bytes: base64,
      };

      this.monitorService.uploadDirectAdToMonitor(this.monitorId, payload).subscribe({
        next: () => {
          this.uploading = false;
          this.toastService.sucesso("File uploaded to screen successfully");
          void this.router.navigate(["/client/screens"]);
        },
        error: () => {
          this.uploading = false;
        },
      });
    };
    reader.onerror = () => {
      this.uploading = false;
      this.toastService.erro("Could not read file");
    };
    reader.readAsDataURL(this.selectedFile);
  }

  private getFileType(file: File): string {
    if (file.type) {
      return file.type;
    }
    const ext = file.name.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf":
        return "application/pdf";
      case "png":
        return "image/png";
      case "gif":
        return "image/gif";
      case "svg":
        return "image/svg+xml";
      default:
        return "image/jpeg";
    }
  }
}
