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
import { ClientService } from "@app/core/service/api/client.service";
import { ConfirmationService } from "primeng/api";
import { BUSINESS_QUESTIONNAIRE_FIELD_META } from "@app/model/dto/request/business-questionnaire-answers.dto";

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
  pendingUpload = false;
  selectedAdFile: File | null = null;
  showValidateAdDialog = false;
  showUploadAdDialog = false;
  selectedAdForValidation: AdResponseDto | null = null;
  showAdMessagesDialog = false;
  adMessages: import("@app/model/dto/response/ad-message-response.dto").AdMessageResponseDto[] = [];
  messagesLoading = false;
  newMessageText = "";
  showAdPreviewDialog = false;
  adPreviewTitle: string | null = null;
  adPreviewLink: string | null = null;

  readonly maxAttachments = 5;
  readonly maxFileSize = 10 * 1024 * 1024;
  readonly acceptedFileTypes = ".jpg,.jpeg,.png,.gif,.svg,.bmp,.tiff,.pdf";

  readonly questionnaireFields = BUSINESS_QUESTIONNAIRE_FIELD_META;

  adRequestWizardStep: 1 | 2 = 1;

  newRequestQuestionnaireForm: FormGroup;
  activeQuestionnaireForm: FormGroup;
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
    private readonly notificationsService: NotificationsService,
    private readonly clientService: ClientService,
    private readonly confirmationService: ConfirmationService
  ) {
    this.newRequestQuestionnaireForm = this.myTelasService.createBusinessQuestionnaireForm();
    this.activeQuestionnaireForm = this.myTelasService.createBusinessQuestionnaireForm();
    this.validateAdForm = this.myTelasService.createValidateAdForm();
    this.uploadAdForm = this.myTelasService.createUploadAdForm();
  }

  ngOnInit(): void {
    this.checkRouteParams();
    this.refreshCartAfterCheckoutReturn();
    void this.loadClientData();
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
      const client = this.myTelasService.authenticatedClient();
      if (client?.adRequest?.businessAnswers) {
        this.myTelasService.patchQuestionnaireForm(
          this.activeQuestionnaireForm,
          client.adRequest.businessAnswers
        );
      }
      if (this.canCreateAdRequest()) {
        await this.myTelasService.loadQuestionnaireDraftIntoForm(this.newRequestQuestionnaireForm);
      }
    } catch (error) {
    }
  }

  maxSelectableInPicker(): number {
    const lib = this.myTelasService.clientAttachments().length;
    return Math.max(0, this.maxAttachments - lib);
  }

  async addSelectedFilesToLibrary(): Promise<void> {
    if (this.selectedFiles.length === 0) {
      return;
    }
    try {
      await this.myTelasService.uploadFilesToLibrary([...this.selectedFiles]);
      this.clearUploadData();
      if (this.attachmentFileUploadComponent) {
        this.attachmentFileUploadComponent.clear();
      }
    } catch {
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

  onFileUpload(event: { currentFiles?: File[] }): void {
    const rawFiles = event.currentFiles;
    if (!rawFiles?.length) {
      return;
    }

    const validateFiles = async () => {
      const libraryCount = this.myTelasService.clientAttachments().length;
      const capacityLeft = this.maxAttachments - libraryCount;

      if (capacityLeft <= 0) {
        this.toastService.aviso(
          `You already have the maximum of ${this.maxAttachments} attachments.`
        );
        this.attachmentFileUploadComponent?.clear();
        return;
      }

      const existingAttachments = this.myTelasService.clientAttachments();
      const accepted: File[] = [];

      for (const file of rawFiles) {
        if (accepted.length >= capacityLeft) {
          this.toastService.aviso(
            `Only ${capacityLeft} more file(s) fit in your library (max ${this.maxAttachments}).`
          );
          break;
        }

        const inLibrary = existingAttachments.some(
          (a) => a.attachmentName === file.name
        );
        if (inLibrary) {
          this.toastService.erro(
            `File "${file.name}" is already in your library.`
          );
          continue;
        }

        const dupPending = accepted.some(
          (f) => f.name === file.name && f.size === file.size
        );
        if (dupPending) {
          continue;
        }

        const validation =
          await this.myTelasService.validateAttachmentFile(file);
        if (!validation.isValid) {
          validation.errors.forEach((err) => this.toastService.erro(err));
          continue;
        }

        accepted.push(file);
      }

      if (accepted.length === 0) {
        this.attachmentFileUploadComponent?.clear();
        return;
      }

      this.selectedFiles = accepted;
      this.uploadPreviews = [];
      accepted.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = () => {
          this.uploadPreviews[index] = reader.result as string;
        };
        reader.readAsDataURL(file);
      });

      this.pendingUpload = true;
      this.cdr.markForCheck();
    };

    validateFiles().catch(() => {
      this.toastService.erro("Error validating files");
      this.attachmentFileUploadComponent?.clear();
    });
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
      this.toastService.erro("Could not replace the attachment.");
      if (input) {
        input.value = "";
      }
      this.attachmentToReplaceId = null;
    }
  }

  confirmRemoveAttachment(attachmentId: string): void {
    this.confirmationService.confirm({
      message: "Remove this attachment from your library?",
      header: "Remove attachment",
      icon: "pi pi-trash",
      acceptLabel: "Remove",
      rejectLabel: "Cancel",
      acceptButtonStyleClass: "p-button-danger",
      accept: () => {
        void this.myTelasService.deleteAttachment(attachmentId);
      },
    });
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

  onAttachmentCheckboxChange(attachmentId: string, event: { checked?: boolean }): void {
    const checked = !!event.checked;
    if (checked) {
      const others = this.selectedClientAttachments.filter((id) => id !== attachmentId);
      if (others.length > 0) {
        this.toastService.aviso(
          "Only one attachment can be selected per ad request."
        );
        this.attachmentCheckboxStates[attachmentId] = false;
        this.cdr.markForCheck();
        return;
      }
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

  goToAttachmentsStep(): void {
    if (this.newRequestQuestionnaireForm.invalid) {
      this.newRequestQuestionnaireForm.markAllAsTouched();
      this.toastService.aviso("Answer all business questions before continuing.");
      return;
    }
    this.adRequestWizardStep = 2;
  }

  goBackToQuestionnaire(): void {
    this.adRequestWizardStep = 1;
  }

  async saveQuestionnaireDraft(): Promise<void> {
    await this.myTelasService.saveQuestionnaireDraft(this.newRequestQuestionnaireForm);
  }

  async updateActiveQuestionnaire(): Promise<void> {
    const id = this.myTelasService.authenticatedClient()?.adRequest?.id;
    if (!id) {
      return;
    }
    await this.myTelasService.updateActiveQuestionnaire(id, this.activeQuestionnaireForm);
  }

  async submitAdRequest(): Promise<void> {
    if (!this.canCreateAdRequest()) {
      this.toastService.aviso(
        "You already have an ad request in progress. Wait for the admin or check your Ads tab."
      );
      return;
    }
    if (this.adRequestWizardStep !== 2) {
      this.toastService.aviso("Use Next to choose your attachment before sending.");
      return;
    }
    if (this.newRequestQuestionnaireForm.valid) {
      const files =
        this.selectedFiles.length > 0 ? [...this.selectedFiles] : null;
      const hasUpload = !!(files?.length);
      const oneSelected = this.selectedClientAttachments.length === 1;

      if (files && files.length > 1) {
        this.toastService.aviso(
          "Only one file per ad request. Remove extra files or send separate requests."
        );
        return;
      }

      if (this.selectedClientAttachments.length > 1) {
        this.toastService.aviso(
          "Select only one attachment per request."
        );
        return;
      }

      if (hasUpload && oneSelected) {
        this.toastService.aviso(
          "Clear either the checkbox selection or the pending upload — one attachment per request."
        );
        return;
      }

      if (!oneSelected && !(hasUpload && files!.length === 1)) {
        const libCount = this.myTelasService.clientAttachments().length;
        this.toastService.aviso(
          libCount >= 1
            ? "Select exactly one attachment using the checkbox above."
            : "Upload one file for your first ad request."
        );
        return;
      }

      const selected = oneSelected ? [...this.selectedClientAttachments] : null;
      const businessAnswers = this.myTelasService.buildAnswersFromForm(this.newRequestQuestionnaireForm);

      try {
        await this.myTelasService.createAdRequestWithOptionalUploads(
          files,
          businessAnswers,
          selected
        );
        this.adRequestWizardStep = 1;
        this.newRequestQuestionnaireForm = this.myTelasService.createBusinessQuestionnaireForm();
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

  approveAd(ad: AdResponseDto): void {
    if (!ad?.id) return;
    this.myTelasService
      .validateAd(ad.id, "APPROVED")
      .then(async () => {
        this.notificationsService
          .refreshAndMarkReferencesAsRead([
          "AD_RECEIVED",
          "AD_RESUBMITTED_FOR_VALIDATION",
        ])
          .subscribe();
        await this.loadClientData();
      })
      .catch(() => {});
  }

  openRejectAdDialog(ad: AdResponseDto): void {
    this.selectedAdForValidation = ad;
    this.showValidateAdDialog = true;
    this.validateAdForm.reset();
    this.validateAdForm.patchValue({ validation: "REJECTED" });
    this.onValidationChange({ value: "REJECTED" });
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
      const validation = "REJECTED";
      let refusedData: RefusedAdRequestDto | undefined;

      const msg = String(this.validateAdForm.get("justification")?.value ?? "").trim();
      const desc = String(this.validateAdForm.get("description")?.value ?? "").trim();
      const full = [msg, desc].filter(Boolean).join("\n");
      refusedData = {
        justification: full.slice(0, 100),
        description: full.length > 100 ? full : undefined,
      };

      try {
        await this.myTelasService.validateAd(
          this.selectedAdForValidation.id,
          validation,
          refusedData
        );
        const fullMsg = [msg, desc].filter(Boolean).join("\n").trim();
        if (fullMsg) {
          await this.clientService
            .sendAdMessage(this.selectedAdForValidation.id, fullMsg)
            .toPromise();
        }
        this.closeValidateAdDialog();
        this.notificationsService
          .refreshAndMarkReferencesAsRead([
          "AD_RECEIVED",
          "AD_RESUBMITTED_FOR_VALIDATION",
        ])
          .subscribe();
        await this.loadClientData();
      } catch (error) {
      }
    }
  }

  openAdMessagesDialog(ad: AdResponseDto): void {
    this.selectedAdForValidation = ad;
    this.showAdMessagesDialog = true;
    this.loadAdMessages(ad.id);
  }

  closeAdMessagesDialog(): void {
    this.showAdMessagesDialog = false;
    this.adMessages = [];
    this.newMessageText = "";
  }

  loadAdMessages(adId: string): void {
    this.messagesLoading = true;
    this.clientService.listAdMessages(adId).subscribe({
      next: (list) => {
        this.adMessages = list ?? [];
        this.messagesLoading = false;
      },
      error: () => {
        this.toastService.erro("Erro ao carregar mensagens.");
        this.messagesLoading = false;
      },
    });
  }

  sendNewMessage(): void {
    if (!this.selectedAdForValidation) return;
    const text = String(this.newMessageText ?? "").trim();
    if (!text) return;
    this.messagesLoading = true;
    this.clientService.sendAdMessage(this.selectedAdForValidation.id, text).subscribe({
      next: () => {
        this.newMessageText = "";
        this.loadAdMessages(this.selectedAdForValidation!.id);
      },
      error: () => {
        this.toastService.erro("Erro ao enviar mensagem.");
        this.messagesLoading = false;
      },
    });
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
