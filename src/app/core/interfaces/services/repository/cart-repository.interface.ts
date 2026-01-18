import { Observable } from 'rxjs';
import { CartRequestDto } from '@app/model/dto/request/cart-request.dto';
import { CartResponseDto } from '@app/model/dto/response/cart-response.dto';
import { IRepository } from './repository.interface';
import { IBaseFilterDto } from '@app/model/interfaces/dto-interfaces';

export interface CartFilterDto extends IBaseFilterDto {}

export interface ICartRepository extends IRepository<CartResponseDto, CartRequestDto, CartRequestDto, CartFilterDto> {
  findLoggedUserCart(): Observable<CartResponseDto | null>;
}
