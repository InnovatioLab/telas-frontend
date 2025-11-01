import { CommonModule } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import {
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { ToastService } from "@app/core/service/state/toast.service";
import { AdResponseDto } from "@app/model/dto/response/ad-response.dto";
import { RefusedAdRequestDto } from "@app/model/dto/request/refused-ad-request.dto";
import { ErrorComponent } from "@app/shared/components";
import { IconsModule } from "@app/shared/icons/icons.module";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { ImageValidationUtil } from "@app/utility/src/utils/image-validation.util";
import { FileUpload } from "primeng/fileupload";
import { Subscription } from "rxjs";
import { AdItemComponent } from "../ad-item/ad-item.component";
import { MyTelasService } from "../../services/my-telas.service";

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
  ],
})
export class MyTelasComponent implements OnInit, OnDestroy {
  @ViewChild("adFileUpload") fileUploadComponent: FileUpload;
  @ViewChild("attachmentFileUpload") attachmentFileUploadComponent: FileUpload;
  @ViewChild("singleReplaceInput") singleReplaceInput: any;

  // Attachment selecionado para substituição
  attachmentToReplaceId: string | null = null;
  selectedClientAttachments: string[] = [];
  attachmentCheckboxStates: { [key: string]: boolean } = {};
  selectedFiles: File[] = [];
  uploadPreviews: string[] = [];
  maxFilesPerUpload = 3;
  pendingUpload = false;
  selectedAdFile: File | null = null;
  showRequestAdDialog = false;
  showValidateAdDialog = false;
  showUploadAdDialog = false;
  selectedAdForValidation: AdResponseDto | null = null;

  readonly maxAttachments = 3;
  readonly maxFileSize = 10 * 1024 * 1024;
  readonly acceptedFileTypes = ".jpg,.jpeg,.png,.gif,.svg,.bmp,.tiff";

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
    private readonly cdr: ChangeDetectorRef
  ) {
    this.requestAdForm = this.myTelasService.createRequestAdForm();
    this.validateAdForm = this.myTelasService.createValidateAdForm();
    this.uploadAdForm = this.myTelasService.createUploadAdForm();

    this.loadClientData();
  }

  ngOnInit(): void {
    this.checkRouteParams();
  }

  ngOnDestroy(): void {
    if (this.routeParamsSubscription) {
      this.routeParamsSubscription.unsubscribe();
    }
  }

  checkRouteParams(): void {
    this.routeParamsSubscription = this.route.queryParams.subscribe(
      (params) => {
        if (params["ads"] && params["ads"] === "true") {
          this.myTelasService.setActiveTab(1);
        }
      }
    );
  }

  async loadClientData(): Promise<void> {
    try {
      const contactData = await this.myTelasService.loadClientData();
      if (contactData) {
        this.requestAdForm.patchValue(
          {
            phone: contactData.phone,
            email: contactData.email,
          },
          { emitEvent: false }
        );
      }
    } catch (error) {
      console.error("Error loading client data:", error);
    }
  }

  onTabChange(event: any): void {
    this.myTelasService.setActiveTab(event.index);
  }

  onFileUpload(event: any): void {
    const files = event.currentFiles;

    if (files && files.length > 0) {
      this.selectedFiles = [];
      this.uploadPreviews = [];

      const validateFiles = async () => {
        for (const file of files) {
          const validation = await this.myTelasService.validateAttachmentFile(file);

          if (!validation.isValid) {
            console.error("Erro de validação de arquivo:", validation.errors);
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
        console.error("Error validating files:", error);
        this.toastService.erro("Error validating files");
        if (this.attachmentFileUploadComponent) {
          this.attachmentFileUploadComponent.clear();
        }
      });
    }
  }

  onUpdateAttachmentClick(attachmentId: string): void {
    this.attachmentToReplaceId = attachmentId;
    try {
      if (this.singleReplaceInput && this.singleReplaceInput.nativeElement) {
        this.singleReplaceInput.nativeElement.value = "";
        this.singleReplaceInput.nativeElement.click();
      } else {
        const el = document.querySelector(
          "input[type=file][#singleReplaceInput]"
        ) as HTMLInputElement;
        if (el) {
          el.value = "";
          el.click();
        }
      }
    } catch (err) {
      console.error("Error opening file selector:", err);
    }
  }

  async onUpdateAttachmentFile(event: any): Promise<void> {
    const file: File | undefined = event?.target?.files?.[0];
    if (!file) {
      return;
    }

    try {
      const validation = await this.myTelasService.validateAttachmentFile(file);
      if (!validation.isValid) {
        validation.errors.forEach((error) => this.toastService.erro(error));
        if (
          this.singleReplaceInput &&
          this.singleReplaceInput.nativeElement
        ) {
          this.singleReplaceInput.nativeElement.value = "";
        }
        return;
      }

      if (!this.attachmentToReplaceId) {
        this.toastService.erro("No attachment selected to replace");
        return;
      }

      await this.myTelasService.replaceAttachment(this.attachmentToReplaceId, file);
      
      if (this.singleReplaceInput && this.singleReplaceInput.nativeElement) {
        this.singleReplaceInput.nativeElement.value = "";
      }
      this.attachmentToReplaceId = null;
      await this.loadClientData();
    } catch (err) {
      console.error("Error replacing attachment:", err);
      if (this.singleReplaceInput && this.singleReplaceInput.nativeElement) {
        this.singleReplaceInput.nativeElement.value = "";
      }
      this.attachmentToReplaceId = null;
    }
  }

  async confirmUpload(): Promise<void> {
    if (this.selectedFiles.length === 0) {
      this.toastService.erro("No files selected for upload");
      return;
    }

    try {
      await this.myTelasService.uploadAttachments(this.selectedFiles);
      this.clearUploadData();

      if (this.attachmentFileUploadComponent) {
        this.attachmentFileUploadComponent.clear();
      }
    } catch (error) {
      console.error("Error uploading attachments:", error);
    }
  }

  cancelUpload(): void {
    this.clearUploadData();
    // Limpar também o componente de upload de attachments
    if (this.attachmentFileUploadComponent) {
      this.attachmentFileUploadComponent.clear();
    }
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

  openRequestAdDialog(): void {
    this.showRequestAdDialog = true;
  }

  closeRequestAdDialog(): void {
    this.showRequestAdDialog = false;
    this.requestAdForm.reset();
  }

  async submitAdRequest(): Promise<void> {
    if (this.requestAdForm.valid) {
      const request = {
        attachmentIds: this.selectedClientAttachments,
        message: this.requestAdForm.get("message")?.value,
        email: this.requestAdForm.get("email")?.value,
        phone: this.requestAdForm.get("phone")?.value,
      };

      try {
        await this.myTelasService.createAdRequest(request);
        this.closeRequestAdDialog();
        this.selectedClientAttachments = [];
        this.attachmentCheckboxStates = {};
        await this.loadClientData();
      } catch (error) {
        console.error("Error submitting request:", error);
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
        await this.loadClientData();
      } catch (error) {
        console.error("Error validating ad:", error);
      }
    }
  }

  downloadAd(link: string): void {
    window.open(link, "_blank");
  }

  mostrarErro(form: FormGroup, campo: string): boolean {
    return form.get(campo)?.invalid && form.get(campo)?.touched;
  }

  mostrarErroForm(form: FormGroup, campo: string): boolean {
    return form.get(campo)?.invalid && form.get(campo)?.touched;
  }

  viewAttachment(link: string): void {
    window.open(link, "_blank");
  }

  downloadAttachment(link: string): void {
    const a = document.createElement("a");
    a.href = link;
    a.download = "";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
        console.error("No file selected");
        this.toastService.erro("No file selected");
        return;
      }

      try {
        const validationResult = await ImageValidationUtil.validateImageFile(file);
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
        console.error("Error validating image:", error);
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
          console.error("Error validating image:", error);
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
  }
}
