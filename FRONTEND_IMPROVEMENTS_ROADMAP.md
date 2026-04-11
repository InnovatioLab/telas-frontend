# Roteiro de Melhorias e Refatoração do Frontend

## 1. Visão Geral

Este documento descreve uma estratégia de refatoração para unificar e aprimorar a arquitetura de acesso a dados do projeto. O objetivo é adotar um padrão de design único e robusto — o **Repository Pattern Genérico** — para aumentar a manutenibilidade, consistência, testabilidade e escalabilidade da base de código.

A estratégia consiste em abandonar a dupla abordagem atual (herança de `BaseHttpService` e `Repository Pattern` manual) em favor de um único padrão superior.

---

## 2. Arquitetura Alvo: Repository Pattern Genérico

A arquitetura final será baseada em três componentes principais:

1.  **Interface de Repositório Genérica (`IRepository<T>`):**
    -   Um contrato que define as operações CRUD padrão (`findAll`, `findById`, `create`, `update`, `delete`, etc.).

2.  **Classe de Repositório Base (`BaseRepository<T>`):**
    -   Uma classe abstrata que implementa `IRepository<T>`.
    -   Conterá a lógica `HttpClient` genérica para todas as operações CRUD, tratando de requisições, paginação e filtros de forma centralizada.
    -   Esta classe absorverá a lógica que hoje existe no `BaseHttpService`.

3.  **Implementações Concretas de Repositório (`EntidadeRepositoryImpl`):**
    -   Para cada entidade (ex: `Client`, `Box`, `Ad`), haverá uma implementação concreta do repositório (ex: `ClientRepositoryImpl`).
    -   Esta classe **estenderá o `BaseRepository<T>`**, herdando toda a funcionalidade CRUD padrão gratuitamente.
    -   Métodos específicos para endpoints que não são CRUD padrão (ex: `findAvailableAddresses` em `Box`) serão implementados aqui.

4.  **Serviços (`EntidadeService`):**
    -   A camada de serviço (`ClientService`, `BoxService`) será completamente desacoplada do `HttpClient`.
    -   Cada serviço irá injetar e consumir a **interface** do seu repositório correspondente (ex: `IClientRepository`), nunca a implementação concreta.

### Diagrama da Arquitetura Proposta:
```
[Componente Angular] -> [EntidadeService] -> [IEntidadeRepository] (Interface)
                                                       ^
                                                       | (Injeção de Dependência)
                                                       |
[EntidadeRepositoryImpl] extends [BaseRepository<T>] <-
       (Lógica Específica)        (Lógica CRUD Genérica com HttpClient)
```

---

## 3. Vantagens da Arquitetura Unificada

-   **Consistência e Padrão Único:** Todo o acesso a dados seguirá o mesmo design, facilitando o entendimento e a manutenção.
-   **Máxima Reutilização de Código (DRY):** A lógica CRUD é escrita uma única vez no `BaseRepository`.
-   **Forte Desacoplamento e Testabilidade:** A camada de serviço depende apenas de interfaces, tornando extremamente fácil mockar a camada de dados em testes unitários.
-   **Manutenção Simplificada:** Alterações na forma como as requisições são feitas (ex: headers, tratamento de erro) são realizadas em um único lugar (`BaseRepository`).

---

## 4. Plano de Ação Priorizado

A refatoração será executada na seguinte ordem:

1.  **[Prioridade Alta] Criar a Base do Repositório Genérico:**
    -   [ ] Definir a interface `IRepository<T>` em `src/app/core/interfaces/services/repository/repository.interface.ts`.
    -   [ ] Criar a classe `BaseRepository<T>` em `src/app/core/service/repository/base.repository.ts`, migrando a lógica do `BaseHttpService` para ela.

2.  **[Prioridade Alta] Refatorar uma Entidade Principal como Prova de Conceito (Ex: `Client`):**
    -   [ ] Criar a interface `IClientRepository` estendendo `IRepository<Client>`.
    -   [ ] Criar a implementação `ClientRepositoryImpl` estendendo `BaseRepository<Client>`.
    -   [ ] Criar o token de injeção `CLIENT_REPOSITORY_TOKEN`.
    -   [ ] Refatorar `ClientService` para injetar `IClientRepository` e remover todo o acesso direto ao `HttpClient`.
    -   [ ] Atualizar a injeção de dependência em `main.ts` ou módulo apropriado.

3.  **[Prioridade Média] Refatorar Serviços Existentes que usam `HttpClient`:**
    -   [ ] Aplicar o mesmo padrão do passo 2 para `AdService`, `PoliticaPrivacidadeService`, e `TermoCondicaoService`. Cada um ganhará sua própria camada de repositório.

4.  **[Prioridade Média] Refatorar Repositórios Existentes para Herdar de `BaseRepository`:**
    -   [ ] Modificar `BoxRepositoryImpl`, `MonitorRepositoryImpl`, `SubscriptionRepositoryImpl`, etc., para que estendam `BaseRepository<T>`.
    -   [ ] Remover a lógica CRUD duplicada dessas classes, mantendo apenas os métodos específicos.

5.  **[Prioridade Baixa] Limpeza Final:**
    -   [ ] Após todos os serviços e repositórios serem migrados, remover os arquivos `BaseHttpService` e `base-htttp.service.ts`.

Este plano de ação unifica a arquitetura, aborda a dívida técnica existente e estabelece um padrão sólido para o futuro desenvolvimento do projeto.
