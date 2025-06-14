import { Route } from "@angular/router";
import { ViewLayoutComponent } from "./page/view-layout.component";
import { GuestLadingComponent } from "./guest-lading/guest-lading.component";

export const ROUTES: Route[] = [
  {
    path: '',
    component: ViewLayoutComponent,
    children: [
      {
        path: '',
        component: GuestLadingComponent,
        title: 'Telas'
      }
    ]
  }
]