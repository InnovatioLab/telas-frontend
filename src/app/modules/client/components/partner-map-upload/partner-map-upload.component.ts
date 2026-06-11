import { CommonModule } from "@angular/common";
import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { PARTNER_PORTAL_ROUTES } from "@app/core/constants/partner-api.paths";
import { ClientService } from "@app/core/service/api/client.service";
import { PartnerPortalService } from "@app/core/service/api/partner-portal.service";
import { ToastService } from "@app/core/service/state/toast.service";
import { AttachmentRequestDto } from "@app/model/dto/request/attachment-request.dto";
import { PartnerAdSubmissionRequestDto } from "@app/model/dto/request/partner-ad-submission.request.dto";
import { Monitor } from "@app/model/monitors";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { FileUploadPipelineService } from "@app/shared/services/file-upload-pipeline.service";
import { isPdfFile } from "@app/shared/utils/file-type.utils";
import { firstValueFrom } from "rxjs";

type SubmissionChoice = "ADMIN_MATERIALS" | "PARTNER_FINISHED_CREATIVE";

interface AttachmentRef {
  attachmentId: string;
  attachmentName: string;
}

interface FilePreview {
  name: string;
  url: string | null;
  isPdf: boolean;
}

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

  selectedCreativeFiles: File[] = [];
  creativeFilePreviews: FilePreview[] = [];
  submitProgress = "";
  selectedMaterialFiles: File[] = [];
  materialPreviews: FilePreview[] = [];

  readonly submissionModeOptions = [
    {
      label: "Create Ad",
      value: "ADMIN_MATERIALS" as SubmissionChoice,
    },
    {
      label: "Finished Ad",
      value: "PARTNER_FINISHED_CREATIVE" as SubmissionChoice,
    },
  ];

  readonly maxFileSize = 10 * 1024 * 1024;
  readonly maxCreativeFiles = 5;
  readonly acceptedFileTypes = ".jpg,.jpeg,.png,.gif,.svg,.bmp,.tiff,.pdf";

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly partnerPortalService: PartnerPortalService,
    private readonly clientService: ClientService,
    private readonly toastService: ToastService,
    private readonly fileUploadPipeline: FileUploadPipelineService
  ) {}

  ngOnInit(): void {
    this.monitorId = this.route.snapshot.paramMap.get("monitorId") ?? "";
    if (!this.monitorId) {
      void this.router.navigate([PARTNER_PORTAL_ROUTES.screens]);
      return;
    }
    this.loadScreen();
  }

  loadScreen(): void {
    this.loadingScreen = true;
    this.partnerPortalService.getPlacementTarget(this.monitorId).subscribe({
      next: (screen) => {
        this.screen = screen;
        this.loadingScreen = false;
      },
      error: () => {
        this.loadingScreen = false;
        this.toastService.error("Failed to load target screen");
        void this.router.navigate([PARTNER_PORTAL_ROUTES.screens]);
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

  isCreateAdMode(): boolean {
    return this.submissionMode === "ADMIN_MATERIALS";
  }

  goBack(): void {
    void this.router.navigate([PARTNER_PORTAL_ROUTES.map]);
  }

  onSubmissionModeChange(): void {
    this.selectedCreativeFiles = [];
    this.creativeFilePreviews = [];
    this.selectedMaterialFiles = [];
    this.materialPreviews = [];
  }

  chooseCreativeFile(): void {
    this.fileInput.nativeElement.click();
  }

  chooseMaterialFiles(): void {
    this.materialsInput.nativeElement.click();
  }

  onCreativeFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = "";
    const valid: File[] = [];
    for (const file of files) {
      if (file.size > this.maxFileSize) {
        this.toastService.error(`${file.name}: max 10MB`);
        continue;
      }
      valid.push(file);
    }
    if (valid.length > this.maxCreativeFiles) {
      this.toastService.warn(`Maximum ${this.maxCreativeFiles} files per submission. Only the first ${this.maxCreativeFiles} were kept.`);
      valid.splice(this.maxCreativeFiles);
    }
    this.selectedCreativeFiles = valid;
    void this.buildCreativeFilePreviews(valid);
  }

  removeCreativeFile(index: number): void {
    this.selectedCreativeFiles = this.selectedCreativeFiles.filter((_, i) => i !== index);
    this.creativeFilePreviews = this.creativeFilePreviews.filter((_, i) => i !== index);
  }

  get submitLabel(): string {
    if (this.submitting && this.submitProgress) {
      return this.submitProgress;
    }
    return "Submit";
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
        this.toastService.error(`${file.name}: max 10MB`);
        continue;
      }
      valid.push(file);
    }
    this.selectedMaterialFiles = valid;
    void this.buildMaterialPreviews(valid);
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
      this.toastService.warn("Select at least one file");
      return;
    }
    this.submitting = true;
    try {
      await firstValueFrom(
        this.clientService.uploadMultipleAttachments(this.selectedMaterialFiles)
      );
      const workspace = await firstValueFrom(this.clientService.getClientWorkspace());
      const attachments = this.normalizeAttachments(workspace?.attachments);
      const ids = this.resolveAttachmentIds(this.selectedMaterialFiles, attachments);
      if (ids.length !== this.selectedMaterialFiles.length) {
        this.toastService.error(
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
        this.partnerPortalService.submitAdSubmission(this.monitorId, payload)
      );
      this.toastService.success("Create Ad request submitted for admin review");
      void this.router.navigate([PARTNER_PORTAL_ROUTES.screens], {
        queryParams: { tab: "requests" },
      });
    } catch {
      this.toastService.error("Failed to submit");
    } finally {
      this.submitting = false;
    }
  }

  private async submitFinishedCreative(): Promise<void> {
    if (this.selectedCreativeFiles.length === 0) {
      this.toastService.warn("Select at least one file");
      return;
    }
    this.submitting = true;
    const total = this.selectedCreativeFiles.length;
    try {
      this.submitProgress = total > 1 ? `Preparing ${total} files…` : "Uploading…";
      const attachments = await Promise.all(
        this.selectedCreativeFiles.map((f) => this.fileToAttachment(f))
      );
      const payload: PartnerAdSubmissionRequestDto = {
        submissionMode: "PARTNER_FINISHED_CREATIVE",
        attachments,
        optionalLabel: this.optionalLabel.trim() || undefined,
      };
      await firstValueFrom(
        this.partnerPortalService.submitAdSubmission(this.monitorId, payload)
      );
      const msg =
        total === 1
          ? "Thank you for uploading your Ad. We'll notify you once it has been uploaded to the screen."
          : `Thank you for uploading your ${total} Ad(s). We'll notify you once they have been uploaded to the screen.`;
      this.toastService.success(msg);
      void this.router.navigate([PARTNER_PORTAL_ROUTES.screens], {
        queryParams: { tab: "requests" },
      });
    } catch (err: unknown) {
      const e = err as { error?: { message?: string; errors?: string[] } };
      const msg =
        e?.error?.message ||
        (Array.isArray(e?.error?.errors) ? e.error!.errors![0] : null) ||
        "Failed to submit";
      this.toastService.error(msg as string);
    } finally {
      this.submitting = false;
      this.submitProgress = "";
    }
  }

  private resolveAttachmentIds(files: File[], attachments: AttachmentRef[]): string[] {
    const pool = [...attachments];
    const ids: string[] = [];
    for (const file of files) {
      const index = this.findLastAttachmentIndex(pool, file.name);
      if (index < 0) {
        return [];
      }
      ids.push(pool[index].attachmentId);
      pool.splice(index, 1);
    }
    return ids;
  }

  private findLastAttachmentIndex(pool: AttachmentRef[], fileName: string): number {
    for (let i = pool.length - 1; i >= 0; i--) {
      if (pool[i].attachmentName === fileName) {
        return i;
      }
    }
    return -1;
  }

  private async buildCreativeFilePreviews(files: File[]): Promise<void> {
    this.creativeFilePreviews = await this.buildFilePreviews(files);
  }

  private async buildMaterialPreviews(files: File[]): Promise<void> {
    this.materialPreviews = await this.buildFilePreviews(files);
  }

  private async buildFilePreviews(files: File[]): Promise<FilePreview[]> {
    const previews: FilePreview[] = [];
    for (const file of files) {
      const isPdf = isPdfFile(file.name);
      if (isPdf) {
        previews.push({ name: file.name, url: null, isPdf: true });
        continue;
      }
      const entry: FilePreview = { name: file.name, url: null, isPdf: false };
      previews.push(entry);
      try {
        entry.url = await this.fileUploadPipeline.readAsDataUrl(file);
      } catch {
        entry.url = null;
      }
    }
    return previews;
  }

  private async fileToAttachment(file: File): Promise<AttachmentRequestDto> {
    const bytes = await this.fileUploadPipeline.readAsBase64(file);
    return {
      name: file.name,
      type: this.fileUploadPipeline.getFileType(file),
      bytes,
    };
  }

  private normalizeAttachments(raw: unknown): AttachmentRef[] {
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
