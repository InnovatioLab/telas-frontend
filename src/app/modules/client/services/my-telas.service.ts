import { Injectable, signal, Injector } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdService } from '@app/core/service/api/ad.service';
import { ClientService } from '@app/core/service/api/client.service';
import { ToastService } from '@app/core/service/state/toast.service';
import { AuthService } from '@app/core/service/auth/auth.service';
import { AdValidationType } from '@app/model/client';
import { ClientAdRequestDto } from '@app/model/dto/request/client-ad-request.dto';
import { CreateClientAdDto } from '@app/model/dto/request/create-client-ad.dto';
import { RefusedAdRequestDto } from '@app/model/dto/request/refused-ad-request.dto';
import { AdResponseDto } from '@app/model/dto/response/ad-response.dto';
import { AttachmentResponseDto } from '@app/model/dto/response/attachment-response.dto';
import { AuthenticatedClientResponseDto } from '@app/model/dto/response/authenticated-client-response.dto';
import { AbstractControlUtils } from '@app/shared/utils/abstract-control.utils';
import { ImageValidationUtil } from '@app/utility/src/utils/image-validation.util';
import { of } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MyTelasService {
  private readonly _authenticatedClient = signal<AuthenticatedClientResponseDto | null>(null);
  private readonly _ads = signal<AdResponseDto[]>([]);
  private readonly _attachments = signal<AttachmentResponseDto[]>([]);
  private readonly _clientAttachments = signal<Array<{
    attachmentId: string;
    attachmentName: string;
    attachmentLink: string;
  }>>([]);
  private readonly _isLoading = signal(false);
  private readonly _activeTabIndex = signal(0);
  private readonly _hasActiveAdRequest = signal(false);
  private readonly _isClientDataLoaded = signal(false);

  readonly authenticatedClient = this._authenticatedClient.asReadonly();
  readonly ads = this._ads.asReadonly();
  readonly attachments = this._attachments.asReadonly();
  readonly clientAttachments = this._clientAttachments.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly activeTabIndex = this._activeTabIndex.asReadonly();
  readonly hasActiveAdRequest = this._hasActiveAdRequest.asReadonly();
  readonly isClientDataLoaded = this._isClientDataLoaded.asReadonly();

  constructor(
    private readonly clientService: ClientService,
    private readonly adService: AdService,
    private readonly toastService: ToastService,
    private readonly fb: FormBuilder,
    private readonly injector: Injector
  ) {}

  createRequestAdForm(): FormGroup {
    return this.fb.group({
      slogan: ["", [Validators.maxLength(50)]],
      brandGuidelineUrl: ["", [AbstractControlUtils.validateUrl(), Validators.maxLength(255)]],
    });
  }

  createValidateAdForm(): FormGroup {
    return this.fb.group({
      validation: ["", [Validators.required]],
      justification: ["", [Validators.maxLength(100)]],
      description: ["", [Validators.maxLength(255)]],
    });
  }

  createUploadAdForm(): FormGroup {
    return this.fb.group({
      name: ["", [Validators.required, Validators.maxLength(255)]],
      type: ["", [Validators.required, Validators.maxLength(15)]],
      adFile: [null, [Validators.required]],
    });
  }

  async loadClientData(forceRefresh: boolean = false): Promise<{ phone: string; email: string } | null> {
    this._isLoading.set(true);

    try {
      const client = await this.clientService.clientAtual$
        .pipe(
          take(1),
          switchMap((client) =>
            client && !forceRefresh ? of(client) : this.clientService.getAuthenticatedClient()
          )
        )
        .toPromise();

      if (client) {
        this._authenticatedClient.set(client as any);
        this._clientAttachments.set((client as any).attachments || []);
        this._hasActiveAdRequest.set((client as any).adRequest !== null);
        this._ads.set((client as any).ads || []);
        this._isClientDataLoaded.set(true);

        if (forceRefresh) {
          if (this.clientService.setClientAtual) {
            this.clientService.setClientAtual(client as any);
          }

          try {
            const authService = this.injector.get(AuthService, null);
            if (authService && typeof authService.updateClientData === 'function') {
              authService.updateClientData(client as any);
            }
          } catch (error) {
            console.debug('AuthService not available for update:', error);
          }
        }

        return {
          phone: (client as any).contact?.phone || "",
          email: (client as any).contact?.email || ""
        };
      }

      return null;
    } catch (error) {
      console.error("Error loading client data:", error);
      this.toastService.erro("Error loading client data");
      this._isClientDataLoaded.set(false);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  setActiveTab(index: number): void {
    this._activeTabIndex.set(index);
  }

  async uploadAttachments(files: File[]): Promise<void> {
    this._isLoading.set(true);

    try {
      await this.clientService.uploadMultipleAttachments(files).toPromise();
      this.toastService.sucesso("Attachments uploaded successfully");
      await this.loadClientData(true);
    } catch (error) {
      this.toastService.erro("Error uploading attachments");
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  async replaceAttachment(attachmentId: string, file: File): Promise<void> {
    this._isLoading.set(true);

    try {
      await this.clientService.uploadAttachment(file, attachmentId).toPromise();
      this.toastService.sucesso("Attachment replaced successfully");
      await this.loadClientData(true);
    } catch (error) {
      this.toastService.erro("Error replacing attachment");
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  async createAdRequest(request: ClientAdRequestDto): Promise<void> {
    this._isLoading.set(true);

    try {
      await this.clientService.createAdRequest(request).toPromise();
      this.toastService.sucesso("Ad request successfully submitted");
      this._hasActiveAdRequest.set(true);
      await this.loadClientData(true);
    } catch (error) {
      this.toastService.erro("Error submitting request");
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  async validateAd(adId: string, validation: string, refusedData?: RefusedAdRequestDto): Promise<void> {
    this._isLoading.set(true);

    try {
      await this.clientService.validateAd(adId, validation, refusedData).toPromise();
      this.toastService.sucesso("Ad validated successfully");
      await this.loadClientData(true);
    } catch (error) {
      this.toastService.erro("Error validating ad");
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  async uploadAd(clientId: string, adDto: CreateClientAdDto): Promise<void> {
    this._isLoading.set(true);

    try {
      await this.adService.createClientAd(clientId, adDto).toPromise();
      this.toastService.sucesso("Ad sent for admin review");
      await this.loadClientData(true);
    } catch (error) {
      console.error("Error uploading ad:", error);
      this.toastService.erro("Error uploading ad");
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  validateAttachmentFile(file: File): Promise<{ isValid: boolean; errors: string[] }> {
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    
    if (!isPdf && !ImageValidationUtil.isValidFileType(file)) {
      return Promise.resolve({
        isValid: false,
        errors: [`File "${file.name}" is invalid. Only images in JPG, PNG, GIF, SVG, BMP, TIFF formats or PDF files are allowed.`],
      });
    }

    if (isPdf) {
      // Para PDF, apenas validar extensão
      if (!/.*\.pdf$/i.test(file.name)) {
        return Promise.resolve({
          isValid: false,
          errors: [`File "${file.name}" is invalid. Only PDF files are allowed.`],
        });
      }
    }

    if (!ImageValidationUtil.isValidFileSize(file, 10)) {
      return Promise.resolve({
        isValid: false,
        errors: [`File "${file.name}" must be at most 10MB.`],
      });
    }

    if (!ImageValidationUtil.isValidFileName(file, 255)) {
      return Promise.resolve({
        isValid: false,
        errors: [`File name "${file.name}" is too long. Maximum of 255 characters allowed.`],
      });
    }

    return Promise.resolve({
      isValid: true,
      errors: [],
    });
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

  canCreateAdRequest(): boolean {
    if (!this._isClientDataLoaded()) {
      return false;
    }

    const client = this._authenticatedClient();
    if (!client || client.adRequest !== null) {
      return false;
    }

    const ads = this._ads();
    if (ads.length > 0) {
      return ads.some((ad) => ad.validation === "REJECTED");
    }

    return client.adRequest !== null ? false : true;
  }

  canValidateAd(ad: AdResponseDto): boolean {
    return ad.validation === "PENDING";
  }

  canUploadDirectAd(): boolean {
    if (!this._isClientDataLoaded()) {
      return false;
    }

    const client = this._authenticatedClient();
    if (!client || client.adRequest !== null || this._ads().length > 0) {
      return false;
    }

    return true;
  }

  shouldShowCreateAdRequestMessage(): boolean {
    if (!this._isClientDataLoaded()) {
      return false;
    }

    const ads = this._ads();
    return (
      ads.length === 1 &&
      ads[0].validation === "REJECTED" &&
      (!this._hasActiveAdRequest() || this._authenticatedClient()?.adRequest === null)
    );
  }

  shouldDisplayMaxValidationsTry(): boolean {
    const ads = this._ads();
    return (
      ads.length > 0 &&
      ads.some((ad) => ad.validation === AdValidationType.PENDING)
    );
  }
}

