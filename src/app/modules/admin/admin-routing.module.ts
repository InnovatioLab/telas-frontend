import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminViewComponent } from './components/admin-view/admin-view.component';
import { AlertViewComponent } from './components/alert-view/alert-view.component';

const routes: Routes = [
  {
    path: '',
    component: AdminViewComponent
  },
  {
    path: 'alerts',
    component: AlertViewComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
