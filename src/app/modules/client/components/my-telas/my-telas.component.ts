import { CommonModule } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { AdService } from "@app/core/service/api/ad.service";
import { ClientService } from "@app/core/service/api/client.service";
import { ToastService } from "@app/core/service/state/toast.service";
import { AdValidationType } from "@app/model/client";
import { ClientAdRequestDto } from "@app/model/dto/request/client-ad-request.dto";
import { CreateClientAdDto } from "@app/model/dto/request/create-client-ad.dto";
import { RefusedAdRequestDto } from "@app/model/dto/request/refused-ad-request.dto";
import { AdResponseDto } from "@app/model/dto/response/ad-response.dto";
import { AttachmentResponseDto } from "@app/model/dto/response/attachment-response.dto";
import { AuthenticatedClientResponseDto } from "@app/model/dto/response/authenticated-client-response.dto";
import { ErrorComponent } from "@app/shared/components";
import { IconsModule } from "@app/shared/icons/icons.module";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { AbstractControlUtils } from "@app/shared/utils/abstract-control.utils";
import { ImageValidationUtil } from "@app/utility/src/utils/image-validation.util";
import { FileUpload } from "primeng/fileupload";
import { Subscription, of } from "rxjs";
import { switchMap, take } from "rxjs/operators";
import { AdItemComponent } from "../ad-item/ad-item.component";

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
  loading = false;
  activeTabIndex: number = 0;

  private routeParamsSubscription: Subscription;

  authenticatedClient: AuthenticatedClientResponseDto | null = null;
  hasActiveAdRequest = false;
  isClientDataLoaded = false;

  clientAttachments: Array<{
    attachmentId: string;
    attachmentName: string;
    attachmentLink: string;
  }> = [];

  selectedClientAttachments: string[] = [];
  attachmentCheckboxStates: { [key: string]: boolean } = {};

  attachments: AttachmentResponseDto[] = [];
  selectedAttachments: string[] = [];
  maxAttachments = 3;
  maxFileSize = 10 * 1024 * 1024;
  acceptedFileTypes = ".jpg,.jpeg,.png,.gif,.svg,.bmp,.tiff";

  selectedFiles: File[] = [];
  uploadPreviews: string[] = [];
  maxFilesPerUpload = 3;
  pendingUpload = false;

  selectedAdFile: File | null = null;
  ads: AdResponseDto[] = [];
  hasAds = false;

  showRequestAdDialog = false;
  showValidateAdDialog = false;
  showUploadAdDialog = false;
  selectedAdForValidation: AdResponseDto | null = null;

  requestAdForm: FormGroup;
  validateAdForm: FormGroup;
  uploadAdForm: FormGroup;

  validationOptions = [
    { label: "Approved", value: "APPROVED" },
    { label: "Rejected", value: "REJECTED" },
  ];

  constructor(
    private readonly clientService: ClientService,
    private readonly adService: AdService,
    private readonly toastService: ToastService,
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.loadAuthenticatedClient();

    this.requestAdForm = this.fb.group({
      message: ["", [Validators.required, Validators.maxLength(255)]],
      phone: ["", [AbstractControlUtils.validatePhone()]],
      email: ["", [Validators.email, Validators.maxLength(255)]],
    });

    this.validateAdForm = this.fb.group({
      validation: ["", [Validators.required]],
      justification: ["", [Validators.maxLength(100)]],
      description: ["", [Validators.maxLength(255)]],
    });

    this.uploadAdForm = this.fb.group({
      name: ["", [Validators.required, Validators.maxLength(255)]],
      type: ["", [Validators.required, Validators.maxLength(15)]],
      adFile: [null, [Validators.required]],
    });
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
          this.activeTabIndex = 1;
        }
      }
    );
  }

  loadAuthenticatedClient(): void {
    this.loading = true;
    this.clientService.clientAtual$
      .pipe(
        take(1),
        switchMap((client) =>
          client ? of(client) : this.clientService.getAuthenticatedClient()
        )
      )
      .subscribe({
        next: (client) => {
          this.authenticatedClient = client as any;
          this.clientAttachments = (client as any).attachments || [];
          this.hasActiveAdRequest = (client as any).adRequest !== null;
          this.ads = (client as any).ads || [];
          this.hasAds = true;
          this.isClientDataLoaded = true;

          if (client) {
            this.requestAdForm.patchValue(
              {
                phone: this.authenticatedClient.contact.phone,
                email: this.authenticatedClient.contact.email,
              },
              { emitEvent: false }
            );
          }

          this.loading = false;
        },
        error: (error) => {
          console.error("Erro ao carregar dados do cliente:", error);
          this.toastService.erro("Error loading client data");
          this.isClientDataLoaded = false;
          this.loading = false;
        },
      });
  }

  onTabChange(event: any): void {
    this.activeTabIndex = event.index;
  }

  private async validateAttachmentFile(
    file: File
  ): Promise<{ isValid: boolean; errors: string[] }> {
    if (!ImageValidationUtil.isValidFileType(file)) {
      return {
        isValid: false,
        errors: [
          `File "${file.name}" is invalid. Only images in JPG, PNG, GIF, SVG, BMP, and TIFF formats are allowed.`,
        ],
      };
    }

    if (!ImageValidationUtil.isValidFileSize(file, 10)) {
      return {
        isValid: false,
        errors: [`File "${file.name}" must be at most 10MB.`],
      };
    }

    if (!ImageValidationUtil.isValidFileName(file, 255)) {
      return {
        isValid: false,
        errors: [
          `File name "${file.name}" is too long. Maximum of 255 characters allowed.`,
        ],
      };
    }

    return {
      isValid: true,
      errors: [],
    };
  }

  onFileUpload(event: any): void {
    const files = event.currentFiles;

    if (files && files.length > 0) {
      this.selectedFiles = [];
      this.uploadPreviews = [];

      const validateFiles = async () => {
        for (const file of files) {
          const validation = await this.validateAttachmentFile(file);

          if (!validation.isValid) {
            console.error("Erro de validação de arquivo:", validation.errors);
            validation.errors.forEach((error) => {
              this.toastService.erro(error);
            });

            // Limpar o componente se alguma validação falhar
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

  onUpdateAttachmentFile(event: any): void {
    const file: File | undefined = event?.target?.files?.[0];
    if (!file) {
      return;
    }

    this.validateAttachmentFile(file)
      .then((validation) => {
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

        this.loading = true;
        this.clientService
          .uploadAttachment(file, this.attachmentToReplaceId)
          .subscribe({
            next: (response) => {
              this.toastService.sucesso("Attachment replaced successfully");
              this.loadAuthenticatedClient();
              this.loading = false;
              if (
                this.singleReplaceInput &&
                this.singleReplaceInput.nativeElement
              ) {
                this.singleReplaceInput.nativeElement.value = "";
              }
              this.attachmentToReplaceId = null;
            },
            error: (error) => {
              console.error("Error replacing attachment:", error);
              this.toastService.erro("Error replacing attachment");
              this.loading = false;
              if (
                this.singleReplaceInput &&
                this.singleReplaceInput.nativeElement
              ) {
                this.singleReplaceInput.nativeElement.value = "";
              }
              this.attachmentToReplaceId = null;
            },
          });
      })
      .catch((err) => {
        console.error("Error validating file:", err);
        this.toastService.erro("Error validating file");
        if (this.singleReplaceInput && this.singleReplaceInput.nativeElement) {
          this.singleReplaceInput.nativeElement.value = "";
        }
      });
  }

  confirmUpload(): void {
    if (this.selectedFiles.length === 0) {
      this.toastService.erro("No files selected for upload");
      return;
    }

    this.loading = true;
    this.clientService.uploadMultipleAttachments(this.selectedFiles).subscribe({
      next: (response) => {
        this.loadAuthenticatedClient();
        this.toastService.sucesso("Attachments uploaded successfully");
        this.loading = false;

        // Limpar dados de upload e componente
        this.clearUploadData();

        if (this.attachmentFileUploadComponent) {
          this.attachmentFileUploadComponent.clear();
        }
      },
      error: (error) => {
        this.toastService.erro("Error uploading attachments");
        this.loading = false;
      },
    });
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

  isValidFileType(file: File): boolean {
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/svg+xml",
      "image/bmp",
      "image/tiff",
    ];
    const isValidType = validTypes.includes(file.type);

    const nameRegex = /.*\.(jpg|jpeg|png|gif|svg|bmp|tiff)$/i;
    const isValidName = nameRegex.test(file.name);

    return isValidType && isValidName;
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

  submitAdRequest(): void {
    if (this.requestAdForm.valid) {
      const request: ClientAdRequestDto = {
        attachmentIds: this.selectedClientAttachments,
        message: this.requestAdForm.get("message")?.value,
        email: this.requestAdForm.get("email")?.value,
        phone: this.requestAdForm.get("phone")?.value,
      };

      this.loading = true;
      this.clientService.createAdRequest(request).subscribe({
        next: () => {
          this.toastService.sucesso("Ad request successfully submitted");
          this.closeRequestAdDialog();

          this.selectedClientAttachments = [];
          this.attachmentCheckboxStates = {};

          this.hasActiveAdRequest = true;
          this.loadAuthenticatedClient();
          this.loading = false;
        },
        error: (error) => {
          this.toastService.erro("Error submitting request");
          this.loading = false;
        },
      });
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

  submitAdValidation(): void {
    if (this.validateAdForm.valid && this.selectedAdForValidation) {
      const validation = this.validateAdForm.get("validation")?.value;
      let refusedData: RefusedAdRequestDto | undefined;

      if (validation === "REJECTED") {
        refusedData = {
          justification: this.validateAdForm.get("justification")?.value,
          description: this.validateAdForm.get("description")?.value,
        };
      }

      this.loading = true;
      this.clientService
        .validateAd(this.selectedAdForValidation.id, validation, refusedData)
        .subscribe({
          next: () => {
            this.toastService.sucesso("Ad validated successfully");
            this.closeValidateAdDialog();
            this.loadAuthenticatedClient();
            this.loading = false;
          },
          error: (error) => {
            this.toastService.erro("Error validating ad");
            this.loading = false;
          },
        });
    }
  }

  getValidationBadgeClass(validation: AdValidationType): string {
    switch (validation) {
      case AdValidationType.PENDING:
        return "badge-warning";
      case AdValidationType.APPROVED:
        return "badge-success";
      case AdValidationType.REJECTED:
        return "badge-danger";
      default:
        return "badge-secondary";
    }
  }

  getValidationLabel(validation: AdValidationType): string {
    switch (validation) {
      case AdValidationType.PENDING:
        return "Pending";
      case AdValidationType.APPROVED:
        return "Approved";
      case AdValidationType.REJECTED:
        return "Rejected";
      default:
        return "Unknown";
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

  shouldDisplayMaxValidationsTry(): boolean {
    return (
      this.ads.length > 0 &&
      this.ads.some((ad) => ad.validation === AdValidationType.PENDING)
    );
  }

  navigateToAdsTab(): void {
    this.activeTabIndex = 1;
  }

  openUploadAdDialog(): void {
    this.showUploadAdDialog = true;
    this.uploadAdForm.reset();
  }

  closeUploadAdDialog(): void {
    this.showUploadAdDialog = false;
    this.uploadAdForm.reset();
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
            type: this.getFileType(file),
          });
          this.selectedAdFile = file;
        })
        .catch((error) => {
          console.error("Error validating image:", error);
          this.toastService.erro("Error validating image file");
          // Limpar o componente de upload em caso de erro
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

  getFileType(file: File): string {
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

  submitAdUpload(event: any): void {
    if (this.uploadAdForm.valid) {
      const formValue = this.uploadAdForm.value;
      const file = formValue.adFile || this.selectedAdFile;

      if (!file) {
        console.error("No file selected");
        this.toastService.erro("No file selected");
        return;
      }

      this.loading = true;
      ImageValidationUtil.validateImageFile(file)
        .then((validationResult) => {
          if (!validationResult.isValid) {
            validationResult.errors.forEach((error) => {
              this.toastService.erro(error);
            });
            this.loading = false;
            return;
          }

          const reader = new FileReader();
          reader.onload = () => {
            const base64String = reader.result as string;
            const base64Data = base64String.split(",")[1];

            const createAdDto: CreateClientAdDto = {
              name: formValue.name,
              type: formValue.type,
              bytes: base64Data,
            };

            this.adService
              .createClientAd(this.authenticatedClient!.id, createAdDto)
              .subscribe({
                next: () => {
                  this.toastService.sucesso("Ad sent for admin review");
                  this.selectedAdFile = null;
                  if (this.fileUploadComponent) {
                    this.fileUploadComponent.clear();
                  }
                  this.loadAuthenticatedClient();
                  this.loading = false;
                },
                error: (error) => {
                  console.error("Error uploading ad:", error);
                  this.toastService.erro("Error uploading ad");
                  this.loading = false;
                },
              });
          };

          reader.readAsDataURL(file);
        })
        .catch((error) => {
          console.error("Error validating image:", error);
          this.toastService.erro("Error validating image file");
          this.loading = false;
        });
    }
  }

  canCreateAdRequest(): boolean {
    if (!this.isClientDataLoaded) {
      return false;
    }

    if (
      !this.authenticatedClient ||
      this.authenticatedClient.adRequest !== null
    ) {
      return false;
    }

    if (this.ads.length > 0) {
      return this.ads.some((ad) => ad.validation === "REJECTED");
    }

    return this.authenticatedClient.adRequest !== null ? false : true;
  }

  canValidateAd(ad: AdResponseDto): boolean {
    return ad.validation === "PENDING";
  }

  canUploadDirectAd(): boolean {
    if (!this.isClientDataLoaded) {
      return false;
    }

    if (
      !this.authenticatedClient ||
      this.authenticatedClient.adRequest !== null ||
      this.ads.length > 0
    ) {
      return false;
    }

    return true;
  }

  shouldShowCreateAdRequestMessage(): boolean {
    if (!this.isClientDataLoaded) {
      return false;
    }

    return (
      this.ads.length === 1 &&
      this.ads[0].validation === "REJECTED" &&
      (!this.hasActiveAdRequest || this.authenticatedClient?.adRequest === null)
    );
  }
}
