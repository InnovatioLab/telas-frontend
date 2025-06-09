import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-view-edit-profile',
  templateUrl: './view-edit-profile.component.html',
  styleUrls: ['./view-edit-profile.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class ViewEditProfileComponent implements OnInit {
  profileForm: FormGroup;
  isEditMode = false;
  loading = false;

  constructor(private fb: FormBuilder) {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      // Adicione mais campos conforme necessário
    });
  }

  ngOnInit(): void {
    // Aqui você pode carregar os dados do perfil do usuário
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    // Simula carregamento dos dados do usuário
    // Será implementado posteriormente com chamada real à API
    this.loading = true;
    setTimeout(() => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '+1 234 567 8901'
      };
      
      this.profileForm.patchValue(userData);
      this.loading = false;
    }, 1000);
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    
    if (!this.isEditMode) {
      // Se saindo do modo de edição, recarrega os dados originais
      this.loadUserProfile();
    }
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      return;
    }
    
    this.loading = true;
    
    // Aqui você implementará a lógica para salvar os dados do perfil
    // Simulação de salvamento
    setTimeout(() => {
      console.log('Profile saved:', this.profileForm.value);
      this.isEditMode = false;
      this.loading = false;
      // Mostrar mensagem de sucesso
    }, 1000);
  }
}
