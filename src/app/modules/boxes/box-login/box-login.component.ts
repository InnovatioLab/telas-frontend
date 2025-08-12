import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IconTvDisplayComponent } from '@app/shared/icons/tv-display.icon';
import { PrimengModule } from '@app/shared/primeng/primeng.module';

interface Box {
  id: string;
  name: string;
}

@Component({
  selector: 'app-box-login',
  standalone: true,
  imports: [CommonModule, PrimengModule, ReactiveFormsModule, IconTvDisplayComponent],
  templateUrl: './box-login.component.html',
  styleUrls: ['./box-login.component.scss']
})
export class BoxLoginComponent {
  form: FormGroup;
  loading = false;
  boxes: Box[] = [
    { id: '1', name: 'Box 1' },
    { id: '2', name: 'Box 2' },
    { id: '3', name: 'Box 3' }
  ];
  selectedBox: Box | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router
  ) {
    this.form = this.fb.group({
      login: ['', Validators.required],
      senha: ['', Validators.required]
    });
  }

  selectBox(box: Box) {
    this.selectedBox = box;
    this.form.reset();
  }

  login(): void {
    if (!this.selectedBox || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    const { login, senha } = this.form.value;
    setTimeout(() => {
      this.loading = false;
      if (login === 'admin' && senha === 'admin') {
        this.router.navigate(['/boxes/status'], { queryParams: { boxId: this.selectedBox.id } });
      } else {
        this.form.get('senha').setErrors({ invalid: true });
      }
    }, 700);
  }
}
