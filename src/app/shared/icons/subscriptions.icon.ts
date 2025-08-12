import { Component, Input } from "@angular/core";

@Component({
  selector: "app-icon-subscriptions",
  standalone: true,
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path
        d="M8 19q-1.65 0-2.825-1.175T4 15V9q0-1.65 1.175-2.825T8 5h8q1.65 0 2.825 1.175T20 9v6q0 1.65-1.175 2.825T16 19H8Zm0-2h8q.825 0 1.413-.588T18 15V9q0-.825-.588-1.413T16 7H8q-.825 0-1.413.588T6 9v6q0 .825.588 1.413T8 17Zm2-1.5 5-3-5-3v6Z"
      />
    </svg>
  `,
})
export class SubscriptionsIconComponent {
  @Input() size: number | string = 24;
}
