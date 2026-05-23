import {
  FormArray,
  FormBuilder,
  FormGroup,
  ValidatorFn,
  Validators,
} from "@angular/forms";
import { Address } from "@app/model/client";
import { AbstractControlUtils } from "@app/shared/utils/abstract-control.utils";

export const BUSINESS_NAME_VALIDATORS: ValidatorFn[] = [
  Validators.required,
  Validators.maxLength(255),
];

export const INDUSTRY_VALIDATORS: ValidatorFn[] = [Validators.maxLength(50)];

export const WEBSITE_URL_VALIDATORS: ValidatorFn[] = [
  Validators.maxLength(255),
  AbstractControlUtils.validateUrl(),
];

export const EMAIL_VALIDATORS: ValidatorFn[] = [
  Validators.required,
  Validators.email,
  Validators.maxLength(255),
];

export const PHONE_VALIDATORS: ValidatorFn[] = [
  Validators.required,
  AbstractControlUtils.validatePhone(),
];

export const STREET_VALIDATORS: ValidatorFn[] = [
  Validators.required,
  Validators.maxLength(100),
  AbstractControlUtils.validateStreet(),
];

export const CITY_VALIDATORS: ValidatorFn[] = [
  Validators.required,
  Validators.maxLength(50),
];

export const STATE_VALIDATORS: ValidatorFn[] = [
  Validators.required,
  Validators.maxLength(2),
  Validators.minLength(2),
];

export const ADDRESS2_VALIDATORS: ValidatorFn[] = [Validators.maxLength(100)];

export const SOCIAL_MEDIA_URL_VALIDATORS: ValidatorFn[] = [
  Validators.required,
  Validators.maxLength(255),
  AbstractControlUtils.validateUrl(),
];

export const ZIP_CODE_VALIDATORS: ValidatorFn[] = [Validators.required];

export const STRICT_ZIP_CODE_VALIDATORS: ValidatorFn[] = [
  Validators.required,
  Validators.minLength(5),
  Validators.maxLength(5),
  Validators.pattern(/^\d{5}$/),
];

export type ContactFieldNaming = "profile" | "modal" | "cadastro";

export interface AddressGroupOptions {
  includeId?: boolean;
  strictZipCode?: boolean;
  requireCountry?: boolean;
}

export interface ProfileFormOptions {
  contactFields?: ContactFieldNaming;
  includeStatus?: boolean;
  includeSocialMedia?: boolean;
  addressOptions?: AddressGroupOptions;
  initialAddressCount?: number;
}

export class ClientProfileFormFactory {
  static zipCodeValidators(strict = false): ValidatorFn[] {
    return strict ? [...STRICT_ZIP_CODE_VALIDATORS] : [...ZIP_CODE_VALIDATORS];
  }

  static countryValidators(requireCountry = false): ValidatorFn[] {
    return requireCountry
      ? [Validators.required, Validators.maxLength(100)]
      : [Validators.maxLength(100)];
  }

  static createEmptyAddressGroup(
    fb: FormBuilder,
    options: AddressGroupOptions = {}
  ): FormGroup {
    const {
      includeId = true,
      strictZipCode = false,
      requireCountry = false,
    } = options;

    const controls: Record<string, unknown> = {
      street: ["", STREET_VALIDATORS],
      zipCode: ["", ClientProfileFormFactory.zipCodeValidators(strictZipCode)],
      city: ["", CITY_VALIDATORS],
      state: ["", STATE_VALIDATORS],
      country: ["US", ClientProfileFormFactory.countryValidators(requireCountry)],
      address2: ["", ADDRESS2_VALIDATORS],
    };

    if (includeId) {
      controls["id"] = [null];
    }

    return fb.group(controls);
  }

  static createAddressGroupFromData(
    fb: FormBuilder,
    addr: Partial<Address>,
    options: AddressGroupOptions = {}
  ): FormGroup {
    const {
      includeId = true,
      strictZipCode = false,
      requireCountry = false,
    } = options;

    const controls: Record<string, unknown> = {
      street: [addr.street ?? "", STREET_VALIDATORS],
      zipCode: [
        addr.zipCode ?? "",
        ClientProfileFormFactory.zipCodeValidators(strictZipCode),
      ],
      city: [addr.city ?? "", CITY_VALIDATORS],
      state: [addr.state ?? "", STATE_VALIDATORS],
      country: [
        addr.country ?? "US",
        ClientProfileFormFactory.countryValidators(requireCountry),
      ],
      address2: [addr.address2 ?? "", ADDRESS2_VALIDATORS],
    };

    if (includeId) {
      controls["id"] = [addr.id ?? null];
    }

    return fb.group(controls);
  }

  static createSocialMediaGroup(
    fb: FormBuilder,
    platform = "",
    url = ""
  ): FormGroup {
    return fb.group({
      platform: [platform, Validators.required],
      url: [url, SOCIAL_MEDIA_URL_VALIDATORS],
    });
  }

  static createBusinessFieldsGroup(
    fb: FormBuilder,
    options: { includeSocialMedia?: boolean } = {}
  ): FormGroup {
    const { includeSocialMedia = true } = options;

    const controls: Record<string, unknown> = {
      businessName: ["", BUSINESS_NAME_VALIDATORS],
      industry: ["", INDUSTRY_VALIDATORS],
      websiteUrl: ["", WEBSITE_URL_VALIDATORS],
    };

    if (includeSocialMedia) {
      controls["socialMedia"] = fb.array([]);
    }

    return fb.group(controls);
  }

  static createContactGroup(
    fb: FormBuilder,
    naming: ContactFieldNaming = "profile"
  ): FormGroup {
    if (naming === "cadastro") {
      return fb.group({
        numeroContato: ["", PHONE_VALIDATORS],
        email: ["", EMAIL_VALIDATORS],
      });
    }

    if (naming === "modal") {
      return fb.group({
        contactEmail: ["", EMAIL_VALIDATORS],
        contactPhone: ["", PHONE_VALIDATORS],
      });
    }

    return fb.group({
      email: ["", EMAIL_VALIDATORS],
      phone: ["", PHONE_VALIDATORS],
    });
  }

  static createSingleAddressGroup(
    fb: FormBuilder,
    options: AddressGroupOptions = {}
  ): FormGroup {
    const { strictZipCode = true, requireCountry = false } = options;

    return fb.group({
      zipCode: [
        "",
        ClientProfileFormFactory.zipCodeValidators(strictZipCode),
      ],
      street: ["", STREET_VALIDATORS],
      city: ["", CITY_VALIDATORS],
      state: ["", STATE_VALIDATORS],
      country: [
        "US",
        ClientProfileFormFactory.countryValidators(requireCountry),
      ],
      address2: ["", ADDRESS2_VALIDATORS],
    });
  }

  static createProfileForm(
    fb: FormBuilder,
    options: ProfileFormOptions = {}
  ): FormGroup {
    const {
      contactFields = "profile",
      includeStatus = false,
      includeSocialMedia = true,
      addressOptions = {},
      initialAddressCount = 0,
    } = options;

    const controls: Record<string, unknown> = {
      businessName: ["", BUSINESS_NAME_VALIDATORS],
      industry: ["", INDUSTRY_VALIDATORS],
      websiteUrl: ["", WEBSITE_URL_VALIDATORS],
      addresses: fb.array([]),
    };

    if (contactFields === "profile") {
      controls["email"] = ["", EMAIL_VALIDATORS];
      controls["phone"] = ["", PHONE_VALIDATORS];
    } else if (contactFields === "modal") {
      controls["contactEmail"] = ["", EMAIL_VALIDATORS];
      controls["contactPhone"] = ["", PHONE_VALIDATORS];
    }

    if (includeStatus) {
      controls["status"] = [null];
    }

    if (includeSocialMedia) {
      controls["socialMedia"] = fb.array([]);
    }

    const form = fb.group(controls);
    const addresses = form.get("addresses") as FormArray;

    const count = Math.max(initialAddressCount, 0);
    for (let i = 0; i < count; i++) {
      addresses.push(
        ClientProfileFormFactory.createEmptyAddressGroup(fb, addressOptions)
      );
    }

    return form;
  }

  static createCadastroForm(fb: FormBuilder): FormGroup {
    return fb.group({
      dadosCliente: ClientProfileFormFactory.createBusinessFieldsGroup(fb, {
        includeSocialMedia: true,
      }),
      enderecoCliente: ClientProfileFormFactory.createSingleAddressGroup(fb, {
        strictZipCode: true,
      }),
      contato: ClientProfileFormFactory.createContactGroup(fb, "cadastro"),
    });
  }
}
