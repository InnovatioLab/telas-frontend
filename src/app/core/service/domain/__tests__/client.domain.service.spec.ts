import { of } from 'rxjs';
import { ClientDomainService } from '../client.domain.service';
import { IClientRepository } from '@app/core/interfaces/services/repository/client-repository.interface';
import { ClientRequestDTO } from '@app/model/dto/request/client-request.dto';
import { Client } from '@app/model/client';

describe('ClientDomainService', () => {
  let service: ClientDomainService;
  let mockRepository: IClientRepository;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getAuthenticatedClient: jest.fn(),
      getClientAds: jest.fn(),
      getClientAttachments: jest.fn()
    };
    
    service = new ClientDomainService(mockRepository);
  });

  it('deve validar dados antes de criar', (done) => {
    const dto: ClientRequestDTO = {
      businessName: 'ACME',
      contact: { email: 'a@a.com', phone: '1' },
      addresses: [],
    };
    const expected: any = { id: '1', businessName: 'ACME' };
    (mockRepository.save as jest.Mock).mockReturnValue(of(expected));

    service.createClient(dto).subscribe((res) => {
      expect(mockRepository.save).toHaveBeenCalledWith(dto);
      expect(res).toEqual(expected);
      done();
    });
  });

  it('deve falhar se dados inválidos', (done) => {
    const dto: ClientRequestDTO = {
      businessName: '',
      contact: { email: '', phone: '' },
      addresses: [],
    } as any;

    service.createClient(dto).subscribe({
      next: () => fail('should error'),
      error: (err) => {
        expect(err).toBeTruthy();
        done();
      },
    });
  });
});


