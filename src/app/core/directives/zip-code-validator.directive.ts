import { Directive, ElementRef, HostListener, Self } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[uiValidateZipCode]',
  standalone: true
})
export class ZipCodeValidatorDirective {
  constructor(
    private readonly el: ElementRef,
    @Self() private readonly control: NgControl
  ) {}

  @HostListener('input', ['$event'])
  onInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, ''); 
    
    if (/^0{5}$/.test(value)) {
      this.control.control?.setErrors({
        ...this.control.control?.errors,
        invalidZipCode: true
      });
    } else if (this.control.control?.errors?.['invalidZipCode'] && value.length === 5 && !/^0{5}$/.test(value)) {
      const errors = { ...this.control.control.errors };
      delete errors['invalidZipCode'];
      
      if (Object.keys(errors).length === 0) {
        this.control.control.setErrors(null);
      } else {
        this.control.control.setErrors(errors);
      }
    }
  }

  @HostListener('blur')
  onBlur() {
    const value = this.el.nativeElement.value.replace(/\D/g, '');
    
    if (/^0{5}$/.test(value)) {
      this.control.control?.setErrors({
        ...this.control.control?.errors,
        invalidZipCode: true
      });
    }
  }
}
