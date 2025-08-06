import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class LayoutUtils {
  static getWidth() {
    if (window.innerWidth <= 576)
      return "95vw"; // xs (mobile)
    else if (window.innerWidth <= 768)
      return "80vw"; // sm (tablet)
    else if (window.innerWidth <= 992)
      return "60vw"; // md
    else if (window.innerWidth <= 1200)
      return "50vw"; // lg
    else if (window.innerWidth <= 1550)
      return "40vw"; // xl
    else return "30vw"; // xxl
  }
}
