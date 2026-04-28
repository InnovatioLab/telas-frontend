import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { DomSanitizer, SafeResourceUrl, SafeUrl } from "@angular/platform-browser";
import {
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { ToastService } from "@app/core/service/state/toast.service";
import { RefusedAdRequestDto } from "@app/model/dto/request/refused-ad-request.dto";
import { AdResponseDto } from "@app/model/dto/response/ad-response.dto";
import { ErrorComponent } from "@app/shared/components";
import { IconsModule } from "@app/shared/icons/icons.module";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { PdfViewerService } from "@app/shared/services/pdf-viewer.service";
import { isPdfFile } from "@app/shared/utils/file-type.utils";
import { ImageValidationUtil } from "@app/utility/src/utils/image-validation.util";
import { triggerBrowserFileDownload } from "@app/shared/utils/file-download.util";
import { PdfViewerModule } from "ng2-pdf-viewer";
import { FileUpload } from "primeng/fileupload";
import { Subscription } from "rxjs";
import { CartService } from "@app/core/service/api/cart.service";
import { MyTelasService } from "../../services/my-telas.service";
import { AdItemComponent } from "../ad-item/ad-item.component";
import { NotificationsService } from "@app/core/service/api/notifications.service";

@Component({
  selector: "app-my-telas",
  templateUrl: "./my-telas.component.html",
  styleUrls: ["./my-telas.component.scss"],
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    ReactiveFormsModule,
    FormsModule,
    ErrorComponent,
    IconsModule,
    AdItemComponent,
    PdfViewerModule,
  ],
})
export class MyTelasComponent implements OnInit, OnDestroy {
  @ViewChild("adFileUpload") fileUploadComponent: FileUpload;
  @ViewChild("attachmentFileUpload") attachmentFileUploadComponent: FileUpload;
  @ViewChild("singleReplaceInput") singleReplaceInput: ElementRef<HTMLInputElement> | undefined;

  // Attachment selecionado para substituição
  attachmentToReplaceId: string | null = null;
  selectedClientAttachments: string[] = [];
  attachmentCheckboxStates: { [key: string]: boolean } = {};
  selectedFiles: File[] = [];
  uploadPreviews: string[] = [];
  maxFilesPerUpload = 3;
  pendingUpload = false;
  selectedAdFile: File | null = null;
  showValidateAdDialog = false;
  showUploadAdDialog = false;
  selectedAdForValidation: AdResponseDto | null = null;
  showAdPreviewDialog = false;
  adPreviewTitle: string | null = null;
  adPreviewLink: string | null = null;

  readonly maxAttachments = 5;
  readonly maxFileSize = 10 * 1024 * 1024;
  readonly acceptedFileTypes = ".jpg,.jpeg,.png,.gif,.svg,.bmp,.tiff,.pdf";

  requestAdForm: FormGroup;
  validateAdForm: FormGroup;
  uploadAdForm: FormGroup;

  validationOptions = [
    { label: "Approved", value: "APPROVED" },
    { label: "Rejected", value: "REJECTED" },
  ];

  private routeParamsSubscription: Subscription;

  constructor(
    public readonly myTelasService: MyTelasService,
    private readonly toastService: ToastService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly pdfViewerService: PdfViewerService,
    private readonly cdr: ChangeDetectorRef,
    private readonly sanitizer: DomSanitizer,
    private readonly cartService: CartService,
    private readonly notificationsService: NotificationsService
  ) {
    this.requestAdForm = this.myTelasService.createRequestAdForm();
    this.validateAdForm = this.myTelasService.createValidateAdForm();
    this.uploadAdForm = this.myTelasService.createUploadAdForm();

    this.loadClientData();
  }

  ngOnInit(): void {
    this.checkRouteParams();
    this.refreshCartAfterCheckoutReturn();
  }

  private refreshCartAfterCheckoutReturn(): void {
    this.cartService.refreshActiveCart().subscribe();
    setTimeout(() => {
      this.cartService.refreshActiveCart().subscribe();
    }, 2500);
  }

  checkRouteParams(): void {
    this.routeParamsSubscription = this.route.queryParams.subscribe(
      (params) => {
        if (params["tab"] === "ads" || params["ads"] === "true") {
          this.myTelasService.setActiveTab(1);
        } else {
          this.myTelasService.setActiveTab(0);
        }
      }
    );
  }

  async loadClientData(): Promise<void> {
    try {
      await this.myTelasService.loadClientData();
    } catch (error) {
    }
  }

  onTabChange(event: { index: number }): void {
    this.myTelasService.setActiveTab(event.index);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: event.index === 1 ? "ads" : "attachments" },
      queryParamsHandling: "merge",
      replaceUrl: true,
    });
  }

  onFileUpload(event: any): void {
    const files = event.currentFiles;

    if (files && files.length > 0) {
      this.selectedFiles = [];
      this.uploadPreviews = [];

      const validateFiles = async () => {
        const existingAttachments = this.myTelasService.clientAttachments();
        
        for (const file of files) {
          const isDuplicate = existingAttachments.some(
            attachment => attachment.attachmentName === file.name
          );

          if (isDuplicate) {
            this.toastService.erro(`File "${file.name}" already exists. Please choose a different file.`);
            if (this.attachmentFileUploadComponent) {
              this.attachmentFileUploadComponent.clear();
            }
            return;
          }

          const validation =
            await this.myTelasService.validateAttachmentFile(file);

          if (!validation.isValid) {
            validation.errors.forEach((error) => {
              this.toastService.erro(error);
            });

            if (this.attachmentFileUploadComponent) {
              this.attachmentFileUploadComponent.clear();
            }
            return;
          }
          this.selectedFiles.push(file);
        }

        this.selectedFiles.forEach((file, index) => {
          const reader = new FileReader();
          reader.onload = () => {
            this.uploadPreviews[index] = reader.result as string;
          };
          reader.readAsDataURL(file);
        });

        this.pendingUpload = true;
      };

      validateFiles().catch((error) => {
        this.toastService.erro("Error validating files");
        if (this.attachmentFileUploadComponent) {
          this.attachmentFileUploadComponent.clear();
        }
      });
    }
  }

  onUpdateAttachmentClick(attachmentId: string): void {
    this.attachmentToReplaceId = attachmentId;
    // Use setTimeout to ensure the ViewChild is available after change detection
    setTimeout(() => {
      const input = this.singleReplaceInput?.nativeElement;
      if (input) {
        input.value = "";
        input.click();
      } else {
        console.warn('singleReplaceInput not found for replacement.');
      }
    }, 100);
  }

  async onUpdateAttachmentFile(event: any): Promise<void> {
    const file: File | undefined = event?.target?.files?.[0];
    const input = this.singleReplaceInput?.nativeElement;
    
    if (!file) {
      if (input) {
        input.value = "";
      }
      return;
    }

    try {
      const validation = await this.myTelasService.validateAttachmentFile(file);
      if (!validation.isValid) {
        validation.errors.forEach((error) => this.toastService.erro(error));
        if (input) {
          input.value = "";
        }
        return;
      }

      if (!this.attachmentToReplaceId) {
        this.toastService.erro("No attachment selected to replace");
        if (input) {
          input.value = "";
        }
        return;
      }

      await this.myTelasService.replaceAttachment(
        this.attachmentToReplaceId,
        file
      );

      if (input) {
        input.value = "";
      }
      this.attachmentToReplaceId = null;
      await this.loadClientData();
    } catch (err) {
      console.error('Error replacing attachment:', err);
      this.toastService.erro("Erro ao substituir arquivo");
      if (input) {
        input.value = "";
      }
      this.attachmentToReplaceId = null;
    }
  }

  previewSelectedFile(file: File): void {
    if (isPdfFile(file.name)) {
      const reader = new FileReader();
      reader.onload = () => {
        const blobUrl = reader.result as string;
        this.pdfViewerService.openPdf(blobUrl, file.name);
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        const imageUrl = reader.result as string;
        window.open(imageUrl, '_blank');
      };
      reader.readAsDataURL(file);
    }
  }

  removeSelectedFile(file: File): void {
    const index = this.selectedFiles.findIndex(f => f.name === file.name && f.size === file.size);
    if (index > -1) {
      this.selectedFiles.splice(index, 1);
      this.uploadPreviews.splice(index, 1);
    }
    if (this.attachmentFileUploadComponent) {
      const files = (this.attachmentFileUploadComponent as any).files || [];
      const fileIndex = files.findIndex((f: File) => f.name === file.name && f.size === file.size);
      if (fileIndex > -1) {
        (this.attachmentFileUploadComponent as any).remove(null, fileIndex);
      }
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  clearUploadData(): void {
    this.selectedFiles = [];
    this.uploadPreviews = [];
    this.pendingUpload = false;
  }

  toggleClientAttachmentSelection(attachmentId: string): void {
    const index = this.selectedClientAttachments.indexOf(attachmentId);
    if (index > -1) {
      this.selectedClientAttachments.splice(index, 1);
    } else {
      this.selectedClientAttachments.push(attachmentId);
    }
  }

  onAttachmentCheckboxChange(attachmentId: string, event: any): void {
    if (event.checked) {
      if (!this.selectedClientAttachments.includes(attachmentId)) {
        this.selectedClientAttachments.push(attachmentId);
      }
      this.attachmentCheckboxStates[attachmentId] = true;
    } else {
      const index = this.selectedClientAttachments.indexOf(attachmentId);
      if (index > -1) {
        this.selectedClientAttachments.splice(index, 1);
      }
      this.attachmentCheckboxStates[attachmentId] = false;
    }
  }

  isClientAttachmentSelected(attachmentId: string): boolean {
    return this.selectedClientAttachments.includes(attachmentId);
  }

  getCheckboxState(attachmentId: string): boolean {
    return this.attachmentCheckboxStates[attachmentId] || false;
  }

  async submitAdRequest(): Promise<void> {
    if (this.requestAdForm.valid) {
      const files = this.selectedFiles.length > 0 ? [...this.selectedFiles] : null;
      const selected =
        this.selectedClientAttachments.length > 0
          ? [...this.selectedClientAttachments]
          : null;
      const slogan = this.requestAdForm.get("slogan")?.value || undefined;
      const brandGuidelineUrl =
        this.requestAdForm.get("brandGuidelineUrl")?.value || undefined;

      try {
        await this.myTelasService.createAdRequestWithOptionalUploads(
          files,
          { slogan, brandGuidelineUrl },
          selected
        );
        this.requestAdForm.reset();
        this.selectedClientAttachments = [];
        this.attachmentCheckboxStates = {};
        this.clearUploadData();
        if (this.attachmentFileUploadComponent) {
          this.attachmentFileUploadComponent.clear();
        }
      } catch (error) {
      }
    }
  }

  openValidateAdDialog(ad: AdResponseDto): void {
    this.selectedAdForValidation = ad;
    this.showValidateAdDialog = true;
    this.validateAdForm.reset();
  }

  closeValidateAdDialog(): void {
    this.showValidateAdDialog = false;
    this.selectedAdForValidation = null;
    this.validateAdForm.reset();
  }

  onValidationChange(event: any): void {
    const validation = event.value;
    const justificationControl = this.validateAdForm.get("justification");

    if (validation === "REJECTED") {
      justificationControl?.setValidators([
        Validators.required,
        Validators.maxLength(100),
      ]);
    } else {
      justificationControl?.clearValidators();
    }

    justificationControl?.updateValueAndValidity();
  }

  async submitAdValidation(): Promise<void> {
    if (this.validateAdForm.valid && this.selectedAdForValidation) {
      const validation = this.validateAdForm.get("validation")?.value;
      let refusedData: RefusedAdRequestDto | undefined;

      if (validation === "REJECTED") {
        refusedData = {
          justification: this.validateAdForm.get("justification")?.value,
          description: this.validateAdForm.get("description")?.value,
        };
      }

      try {
        await this.myTelasService.validateAd(
          this.selectedAdForValidation.id,
          validation,
          refusedData
        );
        this.closeValidateAdDialog();
        this.notificationsService
          .refreshAndMarkReferencesAsRead(["AD_RECEIVED"])
          .subscribe();
        await this.loadClientData();
      } catch (error) {
      }
    }
  }


  mostrarErro(form: FormGroup, campo: string): boolean {
    return form.get(campo)?.invalid && form.get(campo)?.touched;
  }

  mostrarErroForm(form: FormGroup, campo: string): boolean {
    return form.get(campo)?.invalid && form.get(campo)?.touched;
  }

  viewAttachment(link: string, attachmentName?: string): void {
    if (isPdfFile(link, attachmentName)) {
      const title = attachmentName || "Visualizar PDF";
      this.pdfViewerService.openPdf(link, title);
      return;
    }
    this.adPreviewTitle = attachmentName || "Preview";
    this.adPreviewLink = link;
    this.showAdPreviewDialog = true;
  }

  closeAdPreviewDialog(): void {
    this.showAdPreviewDialog = false;
    this.adPreviewTitle = null;
    this.adPreviewLink = null;
  }

  downloadAttachment(url: string, fileName?: string): void {
    triggerBrowserFileDownload(url, fileName);
  }

  onImageError(event: any): void {
    if (event.target) {
      (event.target as HTMLElement).style.display = "none";
    }
  }

  openUploadAdDialog(): void {
    this.showUploadAdDialog = true;
    this.uploadAdForm.reset();
  }

  closeUploadAdDialog(): void {
    this.showUploadAdDialog = false;
    this.uploadAdForm.reset();
  }

  async submitAdUpload(event: any): Promise<void> {
    if (this.uploadAdForm.valid) {
      const formValue = this.uploadAdForm.value;
      const file = formValue.adFile || this.selectedAdFile;

      if (!file) {
        this.toastService.erro("No file selected");
        return;
      }

      try {
        const validationResult =
          await ImageValidationUtil.validateImageFile(file);
        if (!validationResult.isValid) {
          validationResult.errors.forEach((error) => {
            this.toastService.erro(error);
          });
          return;
        }

        const reader = new FileReader();
        reader.onload = async () => {
          const base64String = reader.result as string;
          const base64Data = base64String.split(",")[1];

          const createAdDto = {
            name: formValue.name,
            type: formValue.type,
            bytes: base64Data,
          };

          const client = this.myTelasService.authenticatedClient();
          if (client) {
            await this.myTelasService.uploadAd(client.id, createAdDto);
            this.selectedAdFile = null;
            if (this.fileUploadComponent) {
              this.fileUploadComponent.clear();
            }
            await this.loadClientData();
          }
        };

        reader.readAsDataURL(file);
      } catch (error) {
        this.toastService.erro("Error validating image file");
      }
    }
  }

  onAdFileSelect(event: any): void {
    const file = event.files[0];
    if (file) {
      ImageValidationUtil.validateImageFile(file)
        .then((validationResult) => {
          if (!validationResult.isValid) {
            validationResult.errors.forEach((error) => {
              this.toastService.erro(error);
            });
            if (this.fileUploadComponent) {
              this.fileUploadComponent.clear();
            }
            this.selectedAdFile = null;
            this.uploadAdForm.patchValue({
              adFile: null,
              name: "",
              type: "",
            });
            return;
          }

          this.uploadAdForm.patchValue({
            adFile: file,
            name: file.name,
            type: this.myTelasService.getFileType(file),
          });
          this.selectedAdFile = file;
        })
        .catch((error) => {
          this.toastService.erro("Error validating image file");
          if (this.fileUploadComponent) {
            this.fileUploadComponent.clear();
          }
          this.selectedAdFile = null;
          this.uploadAdForm.patchValue({
            adFile: null,
            name: "",
            type: "",
          });
        });
    }
  }

  getValidationBadgeClass(validation: string): string {
    return this.myTelasService.getValidationBadgeClass(validation as any);
  }

  getValidationLabel(validation: string): string {
    return this.myTelasService.getValidationLabel(validation as any);
  }

  canCreateAdRequest(): boolean {
    return this.myTelasService.canCreateAdRequest();
  }

  canValidateAd(ad: AdResponseDto): boolean {
    return this.myTelasService.canValidateAd(ad);
  }

  canUploadDirectAd(): boolean {
    return this.myTelasService.canUploadDirectAd();
  }

  shouldShowCreateAdRequestMessage(): boolean {
    return this.myTelasService.shouldShowCreateAdRequestMessage();
  }

  shouldDisplayMaxValidationsTry(): boolean {
    return this.myTelasService.shouldDisplayMaxValidationsTry();
  }

  navigateToAdsTab(): void {
    this.myTelasService.setActiveTab(1);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: "ads" },
      queryParamsHandling: "merge",
      replaceUrl: true,
    });
  }

  isPdfLink(url?: string | null, fileName?: string | null): boolean {
    return isPdfFile(url, fileName);
  }

  getSafeImageUrl(url: string | null | undefined): SafeUrl | null {
    if (!url || !String(url).trim()) {
      return null;
    }
    return this.sanitizer.bypassSecurityTrustUrl(String(url).trim());
  }

  getSafePdfUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url + "#view=FitH");
  }

  ngOnDestroy(): void {
    if (this.routeParamsSubscription) {
      this.routeParamsSubscription.unsubscribe();
    }
  }
}
