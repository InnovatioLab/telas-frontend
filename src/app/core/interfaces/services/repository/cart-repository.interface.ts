import { Observable } from 'rxjs';
import { CartRequestDto } from '@app/model/dto/request/cart-request.dto';
import { CartResponseDto } from '@app/model/dto/response/cart-response.dto';

export interface ICartRepository {
  create(request: CartRequestDto): Observable<CartResponseDto>;
  update(request: CartRequestDto, id: string): Observable<CartResponseDto>;
  findById(id: string): Observable<CartResponseDto>;
  findLoggedUserCart(): Observable<CartResponseDto | null>;
}
