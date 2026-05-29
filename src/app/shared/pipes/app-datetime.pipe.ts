import { DatePipe } from "@angular/common";
import { Pipe, PipeTransform, inject } from "@angular/core";
import {
  APP_DATETIME_FORMAT,
  APP_DATETIME_SECONDS_FORMAT,
} from "@app/shared/constants/date-formats";

@Pipe({
  name: "appDateTime",
  standalone: true,
})
export class AppDateTimePipe implements PipeTransform {
  private readonly datePipe = inject(DatePipe);

  transform(value: string | Date | null | undefined): string | null {
    if (value == null || value === "") {
      return null;
    }
    return this.datePipe.transform(value, APP_DATETIME_FORMAT);
  }
}

@Pipe({
  name: "appDateTimeSeconds",
  standalone: true,
})
export class AppDateTimeSecondsPipe implements PipeTransform {
  private readonly datePipe = inject(DatePipe);

  transform(value: string | Date | null | undefined): string | null {
    if (value == null || value === "") {
      return null;
    }
    return this.datePipe.transform(value, APP_DATETIME_SECONDS_FORMAT);
  }
}
