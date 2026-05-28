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

  selectedCreativeFile: File | null = null;
  creativePreviewUrl: string | null = null;
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
        this.toastService.erro("Failed to load target screen");
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
    this.selectedCreativeFile = null;
    this.creativePreviewUrl = null;
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
    void this.buildMaterialPreviews(valid);
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
      this.toastService.aviso("Select at least one file");
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
        this.partnerPortalService.submitAdSubmission(this.monitorId, payload)
      );
      this.toastService.sucesso("Create Ad request submitted for admin review");
      void this.router.navigate([PARTNER_PORTAL_ROUTES.screens], {
        queryParams: { tab: "requests" },
      });
    } catch {
      this.toastService.erro("Failed to submit");
    } finally {
      this.submitting = false;
    }
  }

  private async submitFinishedCreative(): Promise<void> {
    if (!this.selectedCreativeFile) {
      this.toastService.aviso("Select a file");
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
        this.partnerPortalService.submitAdSubmission(this.monitorId, payload)
      );
      this.toastService.sucesso("Finished Ad submitted for admin review");
      void this.router.navigate([PARTNER_PORTAL_ROUTES.screens], {
        queryParams: { tab: "requests" },
      });
    } catch {
      this.toastService.erro("Failed to submit");
    } finally {
      this.submitting = false;
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

  private async buildMaterialPreviews(files: File[]): Promise<void> {
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
    this.materialPreviews = previews;
  }

  private async validateAndSetCreativeFile(file: File): Promise<void> {
    if (file.size > this.maxFileSize) {
      this.toastService.erro("File must be at most 10MB");
      return;
    }
    try {
      const result = isPdfFile(file.name)
        ? { isValid: true, errors: [] as string[] }
        : await this.fileUploadPipeline.validateFile(file);
      if (!result.isValid) {
        result.errors.forEach((msg) => this.toastService.erro(msg));
        return;
      }
      this.selectedCreativeFile = file;
      this.creativePreviewUrl = isPdfFile(file.name)
        ? null
        : await this.fileUploadPipeline.readAsDataUrl(file);
    } catch {
      this.creativePreviewUrl = null;
      this.toastService.erro("Could not validate file");
    }
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
