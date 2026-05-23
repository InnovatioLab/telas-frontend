import { CommonModule } from "@angular/common";
import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { ClientService } from "@app/core/service/api/client.service";
import { MonitorService } from "@app/core/service/api/monitor.service";
import { ToastService } from "@app/core/service/state/toast.service";
import { AttachmentRequestDto } from "@app/model/dto/request/attachment-request.dto";
import { PartnerAdSubmissionRequestDto } from "@app/model/dto/request/partner-ad-submission.request.dto";
import { Monitor } from "@app/model/monitors";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { isPdfFile } from "@app/shared/utils/file-type.utils";
import { ImageValidationUtil } from "@app/utility/src/utils/image-validation.util";
import { firstValueFrom } from "rxjs";

type SubmissionChoice = "ADMIN_MATERIALS" | "PARTNER_FINISHED_CREATIVE";

@Component({
  selector: "app-partner-map-upload",
  standalone: true,
  imports: [CommonModule, PrimengModule, FormsModule],
  templateUrl: "./partner-map-upload.component.html",
  styleUrls: ["./partner-map-upload.component.scss"],
})
export class PartnerMapUploadComponent implements OnInit {
  @ViewChild("fileInput") fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild("materialsInput") materialsInput!: ElementRef<HTMLInputElement>;

  monitorId = "";
  screen: Monitor | null = null;
  loadingScreen = false;
  submitting = false;
  submissionMode: SubmissionChoice = "ADMIN_MATERIALS";
  optionalLabel = "";

  selectedCreativeFile: File | null = null;
  creativePreviewUrl: string | null = null;
  selectedMaterialFiles: File[] = [];

  readonly maxFileSize = 10 * 1024 * 1024;
  readonly acceptedFileTypes = ".jpg,.jpeg,.png,.gif,.svg,.bmp,.tiff,.pdf";

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly monitorService: MonitorService,
    private readonly clientService: ClientService,
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
    this.monitorService.getPartnerPlacementTarget(this.monitorId).subscribe({
      next: (screen) => {
        this.screen = screen;
        this.loadingScreen = false;
      },
      error: () => {
        this.loadingScreen = false;
        this.toastService.erro("Failed to load target screen");
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
    void this.router.navigate(["/client/map"]);
  }

  onSubmissionModeChange(): void {
    this.selectedCreativeFile = null;
    this.creativePreviewUrl = null;
    this.selectedMaterialFiles = [];
  }

  chooseCreativeFile(): void {
    this.fileInput.nativeElement.click();
  }

  chooseMaterialFiles(): void {
    this.materialsInput.nativeElement.click();
  }

  onCreativeFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) {
      return;
    }
    void this.validateAndSetCreativeFile(file);
  }

  onMaterialFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = "";
    if (files.length === 0) {
      return;
    }
    const valid: File[] = [];
    for (const file of files) {
      if (file.size > this.maxFileSize) {
        this.toastService.erro(`${file.name}: max 10MB`);
        continue;
      }
      valid.push(file);
    }
    this.selectedMaterialFiles = valid;
  }

  private async validateAndSetCreativeFile(file: File): Promise<void> {
    if (file.size > this.maxFileSize) {
      this.toastService.erro("File must be at most 10MB");
      return;
    }
    const validate = isPdfFile(file.name)
      ? Promise.resolve({ isValid: true, errors: [] as string[] })
      : ImageValidationUtil.validateImageFile(file);
    try {
      const result = await validate;
      if (!result.isValid) {
        result.errors.forEach((msg) => this.toastService.erro(msg));
        return;
      }
      this.selectedCreativeFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.creativePreviewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    } catch {
      this.toastService.erro("Could not validate file");
    }
  }

  isPdfCreativePreview(): boolean {
    return !!this.selectedCreativeFile && isPdfFile(this.selectedCreativeFile.name);
  }

  submit(): void {
    if (this.submitting) {
      return;
    }
    if (this.submissionMode === "PARTNER_FINISHED_CREATIVE") {
      void this.submitFinishedCreative();
      return;
    }
    void this.submitAdminMaterials();
  }

  private async submitAdminMaterials(): Promise<void> {
    if (this.selectedMaterialFiles.length === 0) {
      this.toastService.aviso("Select at least one reference file");
      return;
    }
    this.submitting = true;
    try {
      await firstValueFrom(
        this.clientService.uploadMultipleAttachments(this.selectedMaterialFiles)
      );
      const client = await firstValueFrom(this.clientService.getAuthenticatedClient());
      const attachments = this.normalizeAttachments(client?.attachments);
      const ids = this.selectedMaterialFiles
        .map((file) => {
          const match = attachments.find((a) => a.attachmentName === file.name);
          return match?.attachmentId ?? "";
        })
        .filter((id) => id.length > 0);
      if (ids.length !== this.selectedMaterialFiles.length) {
        this.toastService.erro(
          "Could not match uploaded files. Refresh and try again."
        );
        return;
      }
      const payload: PartnerAdSubmissionRequestDto = {
        submissionMode: "ADMIN_MATERIALS",
        attachmentIds: ids,
        optionalLabel: this.optionalLabel.trim() || undefined,
      };
      await firstValueFrom(
        this.monitorService.submitPartnerAdSubmission(this.monitorId, payload)
      );
      this.toastService.sucesso("Materials submitted for admin review");
      void this.router.navigate(["/client/screens"]);
    } catch {
      this.toastService.erro("Failed to submit materials");
    } finally {
      this.submitting = false;
    }
  }

  private async submitFinishedCreative(): Promise<void> {
    if (!this.selectedCreativeFile) {
      this.toastService.aviso("Select a creative file");
      return;
    }
    this.submitting = true;
    try {
      const attachment = await this.fileToAttachment(this.selectedCreativeFile);
      const payload: PartnerAdSubmissionRequestDto = {
        submissionMode: "PARTNER_FINISHED_CREATIVE",
        attachment,
        optionalLabel: this.optionalLabel.trim() || undefined,
      };
      await firstValueFrom(
        this.monitorService.submitPartnerAdSubmission(this.monitorId, payload)
      );
      this.toastService.sucesso("Creative submitted for admin review");
      void this.router.navigate(["/client/screens"]);
    } catch {
      this.toastService.erro("Failed to submit creative");
    } finally {
      this.submitting = false;
    }
  }

  private fileToAttachment(file: File): Promise<AttachmentRequestDto> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1] ?? "";
        resolve({
          name: file.name,
          type: this.resolveFileType(file),
          bytes: base64,
        });
      };
      reader.onerror = () => reject(new Error("read failed"));
      reader.readAsDataURL(file);
    });
  }

  private resolveFileType(file: File): string {
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

  private normalizeAttachments(raw: unknown): Array<{
    attachmentId: string;
    attachmentName: string;
  }> {
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw.map(
      (a: { attachmentId?: unknown; id?: unknown; attachmentName?: unknown }) => ({
        attachmentId:
          a?.attachmentId != null
            ? String(a.attachmentId)
            : a?.id != null
              ? String(a.id)
              : "",
        attachmentName:
          typeof a?.attachmentName === "string" ? a.attachmentName : "Attachment",
      })
    );
  }
}
