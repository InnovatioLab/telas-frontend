import { Observable } from 'rxjs';
import { Box } from '@app/model/box';
import { BoxAddress } from '@app/model/box-address';
import { BoxRequestDto } from '@app/model/dto/request/box-request.dto';
import { FilterBoxRequestDto } from '@app/model/dto/request/filter-box-request.dto';
import { PaginationResponseDto } from '@app/model/dto/response/pagination-response.dto';
import { MonitorsBoxMinResponseDto } from '@app/model/dto/response/monitor-box-min-response.dto';
import { Monitor } from '@app/model/monitors';

/**
 * Interface para operações de repositório de Box
 * Implementa o padrão Repository para desacoplar a lógica de acesso a dados
 */
export interface IBoxRepository {
  /**
   * Busca endereços de boxes disponíveis
   * @returns Observable com array de endereços de boxes
   */
  findAvailableAddresses(): Observable<BoxAddress[]>;

  /**
   * Busca monitores disponíveis
   * @returns Observable com array de monitores disponíveis
   */
  findAvailableMonitors(): Observable<MonitorsBoxMinResponseDto[]>;

  /**
   * Busca boxes com filtros
   * @param filters - Filtros de busca
   * @returns Observable com array de boxes
   */
  findAll(filters?: FilterBoxRequestDto): Observable<Box[]>;

  /**
   * Busca boxes com paginação e filtros
   * @param filters - Filtros de paginação e busca
   * @returns Observable com paginação de boxes
   */
  findWithPagination(filters?: FilterBoxRequestDto): Observable<PaginationResponseDto<Box>>;

  /**
   * Busca box por ID
   * @param id - ID do box
   * @returns Observable com box encontrado ou null
   */
  findById(id: string): Observable<Box | null>;

  /**
   * Cria um novo box
   * @param boxRequest - Dados do box para criar
   * @returns Observable com box criado
   */
  create(boxRequest: BoxRequestDto): Observable<Box>;

  /**
   * Atualiza um box existente
   * @param id - ID do box
   * @param boxRequest - Dados do box para atualizar
   * @returns Observable com box atualizado
   */
  update(id: string, boxRequest: BoxRequestDto): Observable<Box>;

  /**
   * Remove um box
   * @param id - ID do box
   * @returns Observable com boolean indicando sucesso
   */
  delete(id: string): Observable<boolean>;

  /**
   * Busca monitores por IP
   * @param ip - IP do box
   * @returns Observable com array de monitores
   */
  findMonitorsByIp(ip: string): Observable<Monitor[]>;
}


