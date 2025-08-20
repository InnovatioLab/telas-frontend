import { DOCUMENT } from "@angular/common";
import { Inject, Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class ToggleModeService {
  private readonly themeSubject = new BehaviorSubject<string>("light");
  public theme$ = this.themeSubject.asObservable();

  constructor(@Inject(DOCUMENT) private readonly document: Document) {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      this.themeSubject.next(savedTheme);
      this.applyTheme(savedTheme);
    }
  }

  public switchThemeMode(theme: string): void {
    this.themeSubject.next(theme);
    localStorage.setItem("theme", theme);
    this.applyTheme(theme);
  }

  private applyTheme(theme: string): void {
    // Remove classes de tema anteriores
    this.document.body.classList.remove("light-theme", "dark-theme");

    // Adiciona a nova classe de tema
    this.document.body.classList.add(`${theme}-theme`);

    // Define o atributo data-theme
    this.document.documentElement.setAttribute("data-theme", theme);

    // Define o color-scheme
    this.document.documentElement.style.colorScheme = theme;
  }
}
