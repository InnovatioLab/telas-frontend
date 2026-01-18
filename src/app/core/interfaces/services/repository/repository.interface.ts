import { Observable } from 'rxjs';
import { PaginationResponseDto } from '@app/model/dto/response/pagination-response.dto';
import { IBaseFilterDto } from '@app/model/interfaces/dto-interfaces';

export interface IRepository<T, CreateDto = Partial<T>, UpdateDto = Partial<T>, FilterDto extends IBaseFilterDto = IBaseFilterDto> {
  findAll(filters?: FilterDto): Observable<T[]>;
  
  findById(id: string): Observable<T | null>;
  
  create(entity: CreateDto): Observable<T>;
  
  update(id: string, entity: UpdateDto): Observable<T>;
  
  delete(id: string): Observable<void | boolean>;
  
  findWithPagination(filters?: FilterDto): Observable<PaginationResponseDto<T>>;
}

