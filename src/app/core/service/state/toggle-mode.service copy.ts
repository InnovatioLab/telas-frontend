import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ToggleModeService {
  
  private themeSubject = new BehaviorSubject<string>('light');
  public theme$ = this.themeSubject.asObservable();
  
  constructor(@Inject(DOCUMENT) private document: Document) {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.themeSubject.next(savedTheme);
      this.applyTheme(savedTheme);
    }
  }
  
  public switchThemeMode(theme: string): void {
    this.themeSubject.next(theme);
    localStorage.setItem('theme', theme);
    this.applyTheme(theme);
  }
  
  private applyTheme(theme: string): void {
    this.cleanupThemeLinks();
    
    this.document.body.classList.remove('light-theme', 'dark-theme');
    this.document.body.classList.add(`${theme}-theme`);
    
    this.document.documentElement.setAttribute('data-theme', theme);
    
    const themeFile = theme === 'dark' ? 'dark-theme.css' : 'theme.css';
    const basePath = 'public/css/';
    
    const link = this.document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = `${basePath}${themeFile}`;
    link.className = 'theme-link';
    
    this.document.head.appendChild(link);
    
    this.document.documentElement.style.colorScheme = theme;
  }
  
  private cleanupThemeLinks(): void {
    const themeLinks = this.document.querySelectorAll('link.theme-link');
    themeLinks.forEach(link => {
      link.parentNode?.removeChild(link);
    });
  }
}