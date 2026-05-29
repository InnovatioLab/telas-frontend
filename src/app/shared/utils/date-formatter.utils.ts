import {
  APP_DATETIME_FORMAT,
  APP_DATETIME_SECONDS_FORMAT,
} from "@app/shared/constants/date-formats";

export class DateFormatter {
  static formatDateTime(
    date: string | Date | undefined,
    withSeconds = false
  ): string {
    if (!date) return "";

    try {
      const dataObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dataObj.getTime())) return "";

      const format: Intl.DateTimeFormatOptions = {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      };
      if (withSeconds) {
        format.second = "2-digit";
      }

      return dataObj.toLocaleString("en-US", format);
    } catch {
      return "";
    }
  }

  static formatarDataBR(date: string | Date | undefined): string {
    return DateFormatter.formatDateTime(date);
  }

  static formatarDataHoraBR(date: string | Date | undefined): string {
    return DateFormatter.formatDateTime(date);
  }

  static readonly datetimeFormat = APP_DATETIME_FORMAT;
  static readonly datetimeSecondsFormat = APP_DATETIME_SECONDS_FORMAT;
}
