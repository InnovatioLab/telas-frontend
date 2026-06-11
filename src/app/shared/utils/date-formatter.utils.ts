import { formatDate } from "@angular/common";
import {
  APP_DATETIME_FORMAT,
  APP_DATETIME_SECONDS_FORMAT,
} from "@app/shared/constants/date-formats";

const LOCALE = "en-US";

export class DateFormatter {
  static formatDateTime(
    date: string | Date | undefined,
    withSeconds = false
  ): string {
    if (!date) {
      return "";
    }

    try {
      const dataObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dataObj.getTime())) {
        return "";
      }

      const pattern = withSeconds
        ? APP_DATETIME_SECONDS_FORMAT
        : APP_DATETIME_FORMAT;

      return formatDate(dataObj, pattern, LOCALE) ?? "";
    } catch {
      return "";
    }
  }

  static formatarDataBR(date: string | Date | undefined): string {
    return DateFormatter.formatDateTime(date);
  }

  static formatDateTimeBR(date: string | Date | undefined): string {
    return DateFormatter.formatDateTime(date);
  }

  static readonly datetimeFormat = APP_DATETIME_FORMAT;
  static readonly datetimeSecondsFormat = APP_DATETIME_SECONDS_FORMAT;
}
