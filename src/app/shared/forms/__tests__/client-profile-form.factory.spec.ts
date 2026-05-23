import { FormBuilder } from "@angular/forms";
import {
  BUSINESS_NAME_VALIDATORS,
  ClientProfileFormFactory,
  EMAIL_VALIDATORS,
  STRICT_ZIP_CODE_VALIDATORS,
  WEBSITE_URL_VALIDATORS,
  ZIP_CODE_VALIDATORS,
} from "../client-profile-form.factory";

describe("ClientProfileFormFactory", () => {
  const fb = new FormBuilder();

  describe("createProfileForm", () => {
    it("deve exigir businessName no perfil", () => {
      const form = ClientProfileFormFactory.createProfileForm(fb, {
        contactFields: "profile",
      });
      const control = form.get("businessName");
      control?.setValue("");
      expect(control?.hasError("required")).toBe(true);
      control?.setValue("Acme Corp");
      expect(control?.valid).toBe(true);
    });

    it("deve usar contactEmail e contactPhone no modo modal", () => {
      const form = ClientProfileFormFactory.createProfileForm(fb, {
        contactFields: "modal",
        includeSocialMedia: false,
      });
      expect(form.get("contactEmail")).toBeTruthy();
      expect(form.get("contactPhone")).toBeTruthy();
      expect(form.get("email")).toBeNull();
    });

    it("deve incluir socialMedia quando configurado", () => {
      const form = ClientProfileFormFactory.createProfileForm(fb, {
        includeSocialMedia: true,
      });
      expect(form.get("socialMedia")).toBeTruthy();
    });
  });

  describe("createEmptyAddressGroup", () => {
    it("deve aplicar validação estrita de CEP quando strictZipCode é true", () => {
      const group = ClientProfileFormFactory.createEmptyAddressGroup(fb, {
        strictZipCode: true,
        includeId: false,
      });
      const zip = group.get("zipCode");
      zip?.setValue("123");
      expect(zip?.hasError("minlength")).toBe(true);
      zip?.setValue("abcde");
      expect(zip?.hasError("pattern")).toBe(true);
      zip?.setValue("12345");
      expect(zip?.valid).toBe(true);
    });

    it("deve aceitar CEP apenas required no modo padrão", () => {
      const group = ClientProfileFormFactory.createEmptyAddressGroup(fb);
      const zip = group.get("zipCode");
      zip?.setValue("123");
      expect(zip?.hasError("minlength")).toBe(false);
      expect(zip?.hasError("required")).toBe(false);
    });
  });

  describe("createSocialMediaGroup", () => {
    it("deve exigir platform e url válida", () => {
      const group = ClientProfileFormFactory.createSocialMediaGroup(fb);
      group.patchValue({ platform: "instagram", url: "" });
      expect(group.get("url")?.hasError("required")).toBe(true);
      group.patchValue({ url: "not-a-url" });
      expect(group.get("url")?.invalid).toBe(true);
    });
  });

  describe("createCadastroForm", () => {
    it("deve criar estrutura de cadastro com subgrupos", () => {
      const form = ClientProfileFormFactory.createCadastroForm(fb);
      expect(form.get("dadosCliente.businessName")).toBeTruthy();
      expect(form.get("enderecoCliente.zipCode")).toBeTruthy();
      expect(form.get("contato.email")).toBeTruthy();
      expect(form.get("contato.numeroContato")).toBeTruthy();
    });

    it("deve validar CEP no enderecoCliente com padrão de 5 dígitos", () => {
      const form = ClientProfileFormFactory.createCadastroForm(fb);
      const zip = form.get("enderecoCliente.zipCode");
      zip?.setValue("12");
      expect(zip?.hasError("pattern")).toBe(true);
    });
  });

  describe("validators exportados", () => {
    it("deve expor conjuntos de validators reutilizáveis", () => {
      expect(BUSINESS_NAME_VALIDATORS.length).toBeGreaterThan(0);
      expect(WEBSITE_URL_VALIDATORS.length).toBeGreaterThan(0);
      expect(EMAIL_VALIDATORS.length).toBeGreaterThan(0);
      expect(STRICT_ZIP_CODE_VALIDATORS.length).toBeGreaterThan(
        ZIP_CODE_VALIDATORS.length
      );
    });
  });
});
