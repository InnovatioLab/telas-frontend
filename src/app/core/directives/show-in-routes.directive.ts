import { Directive, ElementRef, Input, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';

@Directive({
  selector: '[appShowInRoutes]',
  standalone: true
})
export class ShowInRoutesDirective implements OnInit, OnDestroy {
  @Input() appShowInRoutes: string[] = [];
  @Input() hideInRoutes: string[] = [];
  
  private routerSubscription: Subscription;
  private originalDisplay: string;
  
  constructor(
    private readonly el: ElementRef,
    private readonly renderer: Renderer2,
    private readonly router: Router
  ) {}
  
  ngOnInit(): void {
    this.originalDisplay = this.el.nativeElement.style.display ?? '';
    
    this.checkRoute(this.router.url);
    
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.checkRoute(event.url);
      });
  }
  
  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
  
  private checkRoute(url: string): void {
    const shouldShow = this.shouldShowInCurrentRoute(url);
    
    if (shouldShow) {
      this.renderer.setStyle(this.el.nativeElement, 'display', this.originalDisplay);
    } else {
      this.renderer.setStyle(this.el.nativeElement, 'display', 'none');
    }
  }
  
  private shouldShowInCurrentRoute(url: string): boolean {
    if (this.appShowInRoutes && this.appShowInRoutes.length > 0) {
      return this.appShowInRoutes.some(route => url.includes(route));
    }
    
    if (this.hideInRoutes && this.hideInRoutes.length > 0) {
      return !this.hideInRoutes.some(route => url.includes(route));
    }
    
    return true;
  }
}
