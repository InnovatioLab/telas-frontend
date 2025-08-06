import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";
import { ClientService } from "@app/core/service/api/client.service";
import { AuthenticatedClientResponseDto } from "@app/model/dto/response/authenticated-client-response.dto";
import {
  MonitorWishlistResponseDto,
  WishlistResponseDto,
} from "@app/model/dto/response/wishlist-response.dto";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { Subscription } from "rxjs";
import { WishlistItemComponent } from "./wishlist-item/wishlist-item.component";

@Component({
  selector: "feat-wish-list",
  standalone: true,
  imports: [CommonModule, RouterModule, PrimengModule, WishlistItemComponent],
  templateUrl: "./wish-list.component.html",
  styleUrls: ["./wish-list.component.scss"],
})
export class WishListComponent implements OnInit, OnDestroy {
  authenticatedClient: AuthenticatedClientResponseDto | null = null;
  wishlist: WishlistResponseDto | null = null;
  isLoading = true;
  error: string | null = null;

  private subscription = new Subscription();

  constructor(private readonly clientService: ClientService) {}

  ngOnInit(): void {
    this.loadAuthenticatedClient();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadAuthenticatedClient(): void {
    this.isLoading = true;
    this.error = null;

    const authSub = this.clientService.getAuthenticatedClient().subscribe({
      next: (client) => {
        this.authenticatedClient = client;
        this.loadWishlist();
      },
      error: (error) => {
        console.error("Error loading authenticated client:", error);
        this.error = "Error loading client data.";
        this.isLoading = false;
      },
    });

    this.subscription.add(authSub);
  }

  private loadWishlist(): void {
    const wishlistSub = this.clientService.getWishlist().subscribe({
      next: (wishlist) => {
        this.wishlist = wishlist;
        this.isLoading = false;
      },
      error: (error) => {
        console.error("Error loading wishlist:", error);
        this.error = "Error loading wishlist.";
        this.isLoading = false;
      },
    });

    this.subscription.add(wishlistSub);
  }

  get hasWishlistItems(): boolean {
    return this.wishlist?.monitors && this.wishlist.monitors.length > 0;
  }

  get wishlistItems() {
    return this.wishlist?.monitors || [];
  }

  trackByMonitorId(index: number, item: MonitorWishlistResponseDto): string {
    return item.id;
  }
}
