import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
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
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { FileUpload } from "primeng/fileupload";
import { Subscription } from "rxjs";

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
  ],
})
export class MyTelasComponent implements OnInit, OnDestroy {
  @ViewChild("adFileUpload") fileUploadComponent: FileUpload;
  loading = false;
  activeTabIndex: number = 0;

  // Subscription para gerenciar observables
  private routeParamsSubscription: Subscription;

  authenticatedClient: AuthenticatedClientResponseDto | null = null;
  hasActiveAdRequest = false;
  isClientDataLoaded = false; // Flag para controlar se os dados foram carregados

  clientAttachments: Array<{
    attachmentId: string;
    attachmentName: string;
    attachmentLink: string;
  }> = [];

  // Seleção de attachments para request ad
  selectedClientAttachments: string[] = [];
  attachmentCheckboxStates: { [key: string]: boolean } = {};

  // Attachments
  attachments: AttachmentResponseDto[] = [];
  selectedAttachments: string[] = [];
  maxAttachments = 3;
  maxFileSize = 10 * 1024 * 1024;
  acceptedFileTypes = ".jpg,.jpeg,.png,.gif,.svg,.bmp,.tiff";

  // File upload properties
  selectedFiles: File[] = [];
  uploadPreviews: string[] = [];
  maxFilesPerUpload = 3;
  pendingUpload = false; // Flag para controlar upload pendente

  // Ads
  selectedAdFile: File | null = null;
  ads: AdResponseDto[] = [];
  hasAds = false;

  // Dialogs
  showRequestAdDialog = false;
  showValidateAdDialog = false;
  showUploadAdDialog = false;
  selectedAdForValidation: AdResponseDto | null = null;

  // Forms
  requestAdForm: FormGroup;
  validateAdForm: FormGroup;
  uploadAdForm: FormGroup;

  // Validation options
  validationOptions = [
    { label: "Approved", value: "APPROVED" },
    { label: "Rejected", value: "REJECTED" },
  ];

  constructor(
    private readonly clientService: ClientService,
    private readonly adService: AdService,
    private readonly toastService: ToastService,
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute
  ) {
    this.requestAdForm = this.fb.group({
      message: ["", [Validators.required]],
      phone: [
        "",
        [Validators.pattern(/^\+[0-9]{1,3}\s[0-9]{3}\s[0-9]{3}\s[0-9]{4}$/)],
      ],
      email: ["", [Validators.email]],
    });

    this.validateAdForm = this.fb.group({
      validation: ["", [Validators.required]],
      justification: [""],
      description: [""],
    });

    this.uploadAdForm = this.fb.group({
      name: ["", [Validators.required, Validators.maxLength(255)]],
      type: ["", [Validators.required]],
      adFile: [null, [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.checkRouteParams();
    this.loadAuthenticatedClient();
    this.loadAttachments();
  }

  ngOnDestroy(): void {
    if (this.routeParamsSubscription) {
      this.routeParamsSubscription.unsubscribe();
    }
  }

  // Verifica parâmetros da rota e define a tab ativa
  checkRouteParams(): void {
    this.routeParamsSubscription = this.route.queryParams.subscribe(
      (params) => {
        if (params["ads"] === "true") {
          this.activeTabIndex = 1;
        }
      }
    );
  }

  // Carrega dados do cliente autenticado
  loadAuthenticatedClient(): void {
    this.loading = true;
    this.clientService.getAuthenticatedClient().subscribe({
      next: (client) => {
        this.authenticatedClient = client;
        this.clientAttachments = client.attachments || [];
        this.hasActiveAdRequest = client.adRequest !== null;
        this.ads = client.ads || [];
        this.hasAds = true; // Sempre mostrar a tab de ads
        this.isClientDataLoaded = true; // Marcar dados como carregados
        this.loading = false;
      },
      error: (error) => {
        this.toastService.erro("Erro ao carregar dados do cliente");
        this.isClientDataLoaded = false; // Marcar que houve erro no carregamento
        this.loading = false;
      },
    });
  }

  onTabChange(event: any): void {
    this.activeTabIndex = event.index;
  }

  // Upload de attachments - só prepara os arquivos
  onFileUpload(event: any): void {
    const files = event.files;
    if (files && files.length > 0) {
      // Limpar arrays anteriores
      this.selectedFiles = [];
      this.uploadPreviews = [];

      // Validar quantidade de arquivos
      if (files.length > this.maxFilesPerUpload) {
        this.toastService.erro(
          `Maximum of ${this.maxFilesPerUpload} attachments per upload`
        );
        return;
      }

      // Validar cada arquivo
      for (const file of files) {
        // Validar tipo de arquivo
        if (!this.isValidFileType(file)) {
          this.toastService.erro(
            `Attachment "${file.name}" invalid. Only images in JPG, PNG, GIF, SVG, BMP, and TIFF formats are allowed.`
          );
          return;
        }

        // Validar tamanho
        if (file.size > this.maxFileSize) {
          this.toastService.erro(
            `Arquivo "${file.name}" must be no larger than 10MB.`
          );
          return;
        }

        // Validar quantidade total
        if (
          this.clientAttachments.length + files.length >
          this.maxAttachments
        ) {
          this.toastService.erro(
            `Maximum of ${this.maxAttachments} attachments reached. Please remove some before uploading more.`
          );
          return;
        }

        // Validar tamanho do nome do arquivo
        if (file.name.length > 255) {
          this.toastService.erro(
            `Attachment name "${file.name} too long. Maximum 255 characters allowed.`
          );
          return;
        }

        this.selectedFiles.push(file);
      }

      // Preparar previews dos arquivos
      this.selectedFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = () => {
          this.uploadPreviews[index] = reader.result as string;
        };
        reader.readAsDataURL(file);
      });

      // Marcar como pendente para upload
      this.pendingUpload = true;
    }
  }

  // Método para confirmar o upload
  confirmUpload(): void {
    if (this.selectedFiles.length === 0) {
      this.toastService.erro("Nenhum arquivo selecionado para upload");
      return;
    }

    this.loading = true;
    this.clientService.uploadMultipleAttachments(this.selectedFiles).subscribe({
      next: (response) => {
        // Recarregar dados do cliente para obter os novos attachments
        this.loadAuthenticatedClient();
        this.toastService.sucesso("Attachments uploaded successfully");
        this.loading = false;
        // Limpar dados de upload após sucesso
        this.clearUploadData();
      },
      error: (error) => {
        this.toastService.erro("Error uploading attachments");
        this.loading = false;
      },
    });
  }

  // Cancelar upload
  cancelUpload(): void {
    this.clearUploadData();
  }

  // Limpar dados de upload
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

    // Validar também o nome do arquivo
    const nameRegex = /.*\.(jpg|jpeg|png|gif|svg|bmp|tiff)$/i;
    const isValidName = nameRegex.test(file.name);

    return isValidType && isValidName;
  }

  loadAttachments(): void {
    // Implementar carregamento de attachments existentes se necessário
  }

  // Seleção de attachments do cliente
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

  // Request Ad
  openRequestAdDialog(): void {
    // Attachments não são mais obrigatórios para criar AdRequest
    this.showRequestAdDialog = true;
  }

  closeRequestAdDialog(): void {
    this.showRequestAdDialog = false;
    this.requestAdForm.reset();
    // Não limpar selectedClientAttachments aqui para manter a seleção
  }

  submitAdRequest(): void {
    if (this.requestAdForm.valid) {
      const request: ClientAdRequestDto = {
        attachmentIds: this.selectedClientAttachments, // Pode ser array vazio
        message: this.requestAdForm.get("message")?.value,
        email: this.requestAdForm.get("email")?.value,
      };

      this.loading = true;
      this.clientService.createAdRequest(request).subscribe({
        next: () => {
          this.toastService.sucesso("Ad request successfully submitted");
          this.closeRequestAdDialog();
          // Limpar seleção após sucesso
          this.selectedClientAttachments = [];
          this.attachmentCheckboxStates = {};
          // Marcar que agora tem um adRequest ativo
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

  // Utilitários
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

  // Método genérico para mostrar erro em qualquer form
  mostrarErroForm(form: FormGroup, campo: string): boolean {
    return form.get(campo)?.invalid && form.get(campo)?.touched;
  }

  // Visualizar attachment
  viewAttachment(link: string): void {
    window.open(link, "_blank");
  }

  // Download attachment
  downloadAttachment(link: string): void {
    const a = document.createElement("a");
    a.href = link;
    a.download = "";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // Handle image error
  onImageError(event: any): void {
    if (event.target) {
      (event.target as HTMLElement).style.display = "none";
    }
  }

  shouldDisplayMaxValidationsTry(): boolean {
    return (
      this.ads.length > 0 &&
      this.ads.some(
        (ad) =>
          ad.validation === AdValidationType.PENDING && ad.canBeValidatedByOwner
      )
    );
  }

  // Método para navegar programaticamente para a tab de ads
  navigateToAdsTab(): void {
    this.activeTabIndex = 1;
  }

  // Upload direto do Ad
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
      // Validar tipo de arquivo
      if (!this.isValidFileType(file)) {
        console.error("Invalid file type:", file.type);
        this.toastService.erro(
          `File "${file.name}" is invalid. Only images in JPG, PNG, GIF, SVG, BMP, and TIFF formats are allowed.`
        );
        return;
      }

      // Validar tamanho
      if (file.size > this.maxFileSize) {
        console.error("File too large:", file.size);
        this.toastService.erro(`File "${file.name}" must be at most 10MB.`);
        return;
      }

      // Validar tamanho do nome do arquivo
      if (file.name.length > 255) {
        console.error("File name too long:", file.name);
        this.toastService.erro(
          `File name "${file.name}" is too long. Maximum of 255 characters allowed.`
        );

        return;
      }

      this.uploadAdForm.patchValue({
        adFile: file,
        name: file.name,
        type: this.getFileType(file),
      });
      this.selectedAdFile = file;
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

      // Converter arquivo para base64
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(",")[1]; // Remove o prefixo data:image/...;base64,

        const createAdDto: CreateClientAdDto = {
          name: formValue.name,
          type: formValue.type,
          bytes: base64Data,
        };

        this.loading = true;
        this.adService
          .createClientAd(this.authenticatedClient!.id, createAdDto)
          .subscribe({
            next: () => {
              console.log("chamou createClientAd");
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

    // Se tem ads, só pode criar se tiver exatamente 1 ad com status REJECTED
    if (
      this.ads.length > 0 &&
      this.ads.some((ad) => ad.validation === "REJECTED")
    ) {
      return true;
    }

    return this.authenticatedClient.adRequest !== null ? false : true;
  }

  canValidateAd(ad: AdResponseDto): boolean {
    return ad.validation === "PENDING" && ad.canBeValidatedByOwner;
  }

  // Verifica se pode fazer upload direto
  canUploadDirectAd(): boolean {
    // Retornar false se os dados ainda não foram carregados
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

  // Verifica se deve mostrar mensagem para criar AdRequest após rejeição
  shouldShowCreateAdRequestMessage(): boolean {
    // Retornar false se os dados ainda não foram carregados
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
