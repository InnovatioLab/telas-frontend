import { Pipe, PipeTransform } from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";

@Pipe({ name: "safeResourceUrl", standalone: true })
export class SafeResourceUrlPipe implements PipeTransform {
  constructor(private readonly sanitizer: DomSanitizer) {}

  transform(url: string | null | undefined): SafeResourceUrl | null {
    if (!url) return null;
    const trimmed = url.trim();
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(trimmed);
  }
}
