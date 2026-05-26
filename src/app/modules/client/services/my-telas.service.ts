import { Injectable, signal, Injector } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Client } from '@app/model/client';
import { AdService } from '@app/core/service/api/ad.service';
import { ClientService } from '@app/core/service/api/client.service';
import { ToastService } from '@app/core/service/state/toast.service';
import { AuthService } from '@app/core/service/auth/auth.service';
import { AutenticacaoService } from '@app/core/service/api/autenticacao.service';
import { AdValidationType } from '@app/model/client';
import { ClientAdRequestDto } from '@app/model/dto/request/client-ad-request.dto';
import {
  BUSINESS_QUESTIONNAIRE_ANSWER_MAX_LENGTH,
  BUSINESS_QUESTIONNAIRE_FIELD_META,
  BusinessQuestionnaireAnswersDto,
} from '@app/model/dto/request/business-questionnaire-answers.dto';
import { CreateClientAdDto } from '@app/model/dto/request/create-client-ad.dto';
import { RefusedAdRequestDto } from '@app/model/dto/request/refused-ad-request.dto';
import {
  AD_APPROVED_SUCCESS_TOAST,
  AD_REJECTED_SENT_BACK_TO_ADMIN_TOAST,
} from '@app/shared/constants/ad-validation-toast.constants';
import { AdResponseDto } from '@app/model/dto/response/ad-response.dto';
import { AttachmentResponseDto } from '@app/model/dto/response/attachment-response.dto';
import { AuthenticatedClientResponseDto } from '@app/model/dto/response/authenticated-client-response.dto';
import { mergeAuthenticatedClientWithWorkspace } from '@app/core/service/client-workspace.util';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MyTelasService {
  private readonly _authenticatedClient = signal<AuthenticatedClientResponseDto | null>(null);
  private readonly _ads = signal<AdResponseDto[]>([]);
  private readonly _attachments = signal<AttachmentResponseDto[]>([]);
  private readonly _clientAttachments = signal<
    Array<{
      attachmentId: string;
      attachmentName: string;
      attachmentLink: string;
      attachmentDownloadLink?: string;
    }>
  >([]);
  private readonly _isLoading = signal(false);
  private readonly _activeTabIndex = signal(0);
  private readonly _hasActiveAdRequest = signal(false);
  private readonly _isClientDataLoaded = signal(false);
  private clientDataLoadPromise: Promise<{ phone: string; email: string } | null> | null =
    null;

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

  createBusinessQuestionnaireForm(): FormGroup {
    const rules = [
      Validators.required,
      Validators.maxLength(BUSINESS_QUESTIONNAIRE_ANSWER_MAX_LENGTH),
    ];
    const group: Record<string, unknown> = {};
    for (const { key } of BUSINESS_QUESTIONNAIRE_FIELD_META) {
      group[key as string] = ['', rules];
    }
    return this.fb.group(group);
  }

  patchQuestionnaireForm(
    form: FormGroup,
    data: Partial<BusinessQuestionnaireAnswersDto> | null | undefined
  ): void {
    if (!data) {
      return;
    }
    for (const { key } of BUSINESS_QUESTIONNAIRE_FIELD_META) {
      const v = data[key];
      if (typeof v === 'string') {
        form.get(key as string)?.setValue(v);
      }
    }
  }

  async loadQuestionnaireDraftIntoForm(form: FormGroup): Promise<void> {
    try {
      const draft = await this.clientService
        .getBusinessQuestionnaireDraft()
        .pipe(take(1))
        .toPromise();
      this.patchQuestionnaireForm(form, draft ?? undefined);
    } catch {
    }
  }

  async saveQuestionnaireDraft(form: FormGroup): Promise<void> {
    if (form.invalid) {
      form.markAllAsTouched();
      this.toastService.erro('Please complete all questions.');
      return;
    }
    const body = this.buildAnswersFromForm(form);
    await this.clientService.saveBusinessQuestionnaireDraft(body).pipe(take(1)).toPromise();
    this.toastService.sucesso('Draft saved.');
  }

  buildAnswersFromForm(form: FormGroup): BusinessQuestionnaireAnswersDto {
    const raw = form.getRawValue() as Record<string, string>;
    const out = {} as BusinessQuestionnaireAnswersDto;
    for (const { key } of BUSINESS_QUESTIONNAIRE_FIELD_META) {
      out[key] = String(raw[key as string] ?? '').trim();
    }
    return out;
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

  async loadClientData(): Promise<{ phone: string; email: string } | null> {
    if (!this.clientDataLoadPromise) {
      this.clientDataLoadPromise = this.runLoadClientData();
    }
    try {
      return await this.clientDataLoadPromise;
    } finally {
      this.clientDataLoadPromise = null;
    }
  }

  private hydrateFromAuthLoggedClientIfEmpty(): void {
    const autenticacao = this.injector.get(AutenticacaoService, null);
    const logged = autenticacao?.loggedClient ?? null;
    if (!logged?.id) {
      return;
    }
    this._authenticatedClient.set(logged);
    this._clientAttachments.set(this.normalizeClientAttachments(logged.attachments));
    this._hasActiveAdRequest.set(this.adRequestIsOpen(logged.adRequest));
    this._ads.set(Array.isArray(logged.ads) ? logged.ads : []);
    this._isClientDataLoaded.set(true);
    if (this.clientService.setClientAtual) {
      this.clientService.setClientAtual(logged as unknown as Client);
    }
    try {
      const authService = this.injector.get(AuthService, null);
      if (authService && typeof authService.updateClientData === "function") {
        authService.updateClientData(logged as unknown as Client);
      }
    } catch {
    }
  }

  private async runLoadClientData(): Promise<{ phone: string; email: string } | null> {
    this._isLoading.set(true);

    try {
      this.hydrateFromAuthLoggedClientIfEmpty();

      const session = await firstValueFrom(
        this.clientService.getAuthenticatedClient()
      );
      if (!session) {
        return null;
      }

      let dto: AuthenticatedClientResponseDto = session;
      try {
        const workspace = await firstValueFrom(
          this.clientService.getClientWorkspace()
        );
        dto = mergeAuthenticatedClientWithWorkspace(session, workspace);
      } catch {
        this.toastService.aviso(
          "Could not load ads workspace. Some screens may be incomplete."
        );
      }

      this.applyAuthenticatedClient(dto);

      return {
        phone: dto.contact?.phone || "",
        email: dto.contact?.email || "",
      };
    } catch (error) {
      this.toastService.erro("Error loading client data");
      if (this._authenticatedClient() === null) {
        this._isClientDataLoaded.set(false);
      }
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  setActiveTab(index: number): void {
    this._activeTabIndex.set(index);
  }

  private applyAuthenticatedClient(dto: AuthenticatedClientResponseDto): void {
    this._authenticatedClient.set(dto);
    this._clientAttachments.set(
      this.normalizeClientAttachments(dto.attachments as unknown)
    );
    this._hasActiveAdRequest.set(this.adRequestIsOpen(dto.adRequest));
    this._ads.set(dto.ads || []);
    this._isClientDataLoaded.set(true);

    if (this.clientService.setClientAtual) {
      this.clientService.setClientAtual(dto as unknown as Client);
    }

    try {
      const authService = this.injector.get(AuthService, null);
      if (authService && typeof authService.updateClientData === "function") {
        authService.updateClientData(dto as unknown as Client);
      }
    } catch {
    }
  }

  private adRequestIsOpen(
    ar: AuthenticatedClientResponseDto["adRequest"] | null | undefined
  ): boolean {
    if (ar == null) {
      return false;
    }
    const flags = ar as { active?: boolean; isActive?: boolean };
    if (flags.active === false || flags.isActive === false) {
      return false;
    }
    return true;
  }

  private normalizeClientAttachments(raw: unknown): Array<{
    attachmentId: string;
    attachmentName: string;
    attachmentLink: string;
    attachmentDownloadLink?: string;
  }> {
    if (!Array.isArray(raw)) {
      return [];
    }
    const toAbsoluteUrl = (url: unknown): string => {
      if (typeof url !== "string") return "";
      const trimmed = url.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("//")) {
        return `https:${trimmed}`;
      }
      if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)) return trimmed;
      return `https://${trimmed.replace(/^\/+/, "")}`;
    };
    return raw.map(
      (a: {
        attachmentId?: unknown;
        id?: unknown;
        attachmentName?: unknown;
        attachmentLink?: unknown;
        attachmentDownloadLink?: unknown;
      }) => ({
        attachmentId:
          a?.attachmentId != null
            ? String(a.attachmentId)
            : a?.id != null
              ? String(a.id)
              : '',
        attachmentName:
          typeof a?.attachmentName === 'string' && a.attachmentName.trim()
            ? a.attachmentName
            : 'Attachment',
        attachmentLink: toAbsoluteUrl(a?.attachmentLink),
        attachmentDownloadLink:
          typeof a?.attachmentDownloadLink === 'string' ? toAbsoluteUrl(a.attachmentDownloadLink) : undefined,
      })
    );
  }

  async createAdRequestWithOptionalUploads(
    files: File[] | null,
    businessAnswers: BusinessQuestionnaireAnswersDto,
    selectedAttachmentIds: string[] | null
  ): Promise<void> {
    this._isLoading.set(true);

    try {
      if (files && files.length > 0) {
        await this.clientService.uploadMultipleAttachments(files).toPromise();
        await this.loadClientData();
      }

      const uploaded = files && files.length === 1 ? files[0] : null;
      const chosen =
        selectedAttachmentIds && selectedAttachmentIds.length === 1
          ? selectedAttachmentIds[0]
          : null;

      let ids: string[];
      if (chosen) {
        ids = [chosen];
      } else if (uploaded) {
        const match = this._clientAttachments().find(
          (a) => a.attachmentName === uploaded.name
        );
        if (!match?.attachmentId) {
          this.toastService.erro(
            "Could not match the uploaded file. Refresh the page and try again."
          );
          throw new Error("ATTACHMENT_MATCH_FAILED");
        }
        ids = [match.attachmentId];
      } else {
        this.toastService.erro(
          "Select exactly one attachment or upload a single file for this request."
        );
        throw new Error("NO_ATTACHMENT_CHOSEN");
      }

      const request: ClientAdRequestDto = {
        attachmentIds: ids,
        businessAnswers,
      };

      await this.clientService.createAdRequest(request).toPromise();
      this.toastService.sucesso("Ad request successfully submitted");
      this._hasActiveAdRequest.set(true);
      await this.loadClientData();
    } catch (error) {
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  async uploadFilesToLibrary(files: File[]): Promise<void> {
    if (!files.length) {
      return;
    }
    this._isLoading.set(true);
    try {
      await this.clientService.uploadMultipleAttachments(files).toPromise();
      this.toastService.sucesso("Files added to your library.");
      await this.loadClientData();
    } catch (error) {
      this.toastService.erro("Could not upload files");
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  async deleteAttachment(attachmentId: string): Promise<void> {
    this._isLoading.set(true);
    try {
      await this.clientService.deleteClientAttachment(attachmentId).pipe(take(1)).toPromise();
      this.toastService.sucesso("Attachment removed");
      await this.loadClientData();
    } catch (error) {
      this.toastService.erro("Could not remove attachment");
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
      await this.loadClientData();
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
      await this.loadClientData();
    } catch (error) {
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  async validateAd(adId: string, validation: string, refusedData?: RefusedAdRequestDto): Promise<void> {
    this._isLoading.set(true);

    try {
      await this.clientService.validateAd(adId, validation, refusedData).toPromise();
      if (validation === "APPROVED") {
        this.toastService.sucesso(AD_APPROVED_SUCCESS_TOAST);
      } else if (validation === "REJECTED") {
        this.toastService.aviso(AD_REJECTED_SENT_BACK_TO_ADMIN_TOAST);
      } else {
        this.toastService.sucesso("Ad updated.");
      }
      await this.loadClientData();
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
      await this.loadClientData();
    } catch (error) {
      this.toastService.erro("Error uploading ad");
      throw error;
    } finally {
      this._isLoading.set(false);
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
    if (!client || this.adRequestIsOpen(client.adRequest)) {
      return false;
    }

    const ads = this._ads();
    if (ads.some((ad) => ad.validation === "PENDING")) {
      return false;
    }

    return true;
  }

  canValidateAd(ad: AdResponseDto): boolean {
    return ad.validation === "PENDING";
  }

  canUploadDirectAd(): boolean {
    if (!this._isClientDataLoaded()) {
      return false;
    }

    const client = this._authenticatedClient();
    if (!client || this.adRequestIsOpen(client.adRequest) || this._ads().length > 0) {
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
      !this._hasActiveAdRequest()
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

