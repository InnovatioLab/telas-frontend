import { CommonModule } from "@angular/common";
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ClientService } from "@app/core/service/api/client.service";
import { ToastService } from "@app/core/service/state/toast.service";
import { AdMessageResponseDto } from "@app/model/dto/response/ad-message-response.dto";
import { PrimengModule } from "@app/shared/primeng/primeng.module";

@Component({
  selector: "app-admin-ad-messages-dialog",
  standalone: true,
  imports: [CommonModule, PrimengModule, FormsModule],
  templateUrl: "./admin-ad-messages-dialog.component.html",
})
export class AdminAdMessagesDialogComponent implements OnChanges {
  @Input() visible = false;
  @Input() adId: string | null = null;
  @Input() adLabel = "";

  @Output() readonly visibleChange = new EventEmitter<boolean>();

  messages: AdMessageResponseDto[] = [];
  newMessageText = "";
  loading = false;

  constructor(
    private readonly clientService: ClientService,
    private readonly toastService: ToastService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["visible"] || changes["adId"]) {
      if (this.visible && this.adId) {
        this.loadMessages();
      } else if (!this.visible) {
        this.messages = [];
        this.newMessageText = "";
      }
    }
  }

  onHide(): void {
    this.visibleChange.emit(false);
  }

  loadMessages(): void {
    const id = String(this.adId ?? "").trim();
    if (!id) {
      return;
    }
    this.loading = true;
    this.clientService.listAdMessages(id).subscribe({
      next: (list) => {
        this.messages = list ?? [];
        this.loading = false;
      },
      error: () => {
        this.toastService.error("Failed to load messages");
        this.loading = false;
      },
    });
  }

  sendMessage(): void {
    const id = String(this.adId ?? "").trim();
    const text = String(this.newMessageText ?? "").trim();
    if (!id || !text) {
      return;
    }
    this.loading = true;
    this.clientService.sendAdMessage(id, text).subscribe({
      next: () => {
        this.newMessageText = "";
        this.loadMessages();
      },
      error: () => {
        this.toastService.error("Failed to send message");
        this.loading = false;
      },
    });
  }
}
