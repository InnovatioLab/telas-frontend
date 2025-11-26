# 🏗️ Estrutura de Interfaces - Telas Project

## 📁 Organização das Interfaces

```
src/app/
├── core/
│   ├── interfaces/
│   │   ├── services/           # Interfaces para Services
│   │   │   ├── repository/     # Repository Pattern
│   │   │   ├── domain/         # Domain Services
│   │   │   └── external/       # External Services
│   │   ├── state/             # Interfaces para Estado
│   │   ├── config/            # Interfaces para Configurações
│   │   └── common/            # Interfaces Comuns
├── shared/
│   ├── interfaces/
│   │   ├── components/        # Interfaces para Componentes
│   │   ├── forms/            # Interfaces para Formulários
│   │   ├── ui/               # Interfaces para UI
│   │   └── utils/            # Interfaces para Utilitários
└── model/
    ├── interfaces/           # Interfaces de Domínio
    └── contracts/            # Contratos de API
```

## 🎯 Princípios das Interfaces

### **1. Single Responsibility**
- Cada interface tem uma responsabilidade específica
- Separação clara entre contrato e implementação

### **2. Interface Segregation**
- Interfaces pequenas e focadas
- Evitar interfaces "gordas"

### **3. Dependency Inversion**
- Depender de abstrações, não implementações
- Facilita testes e manutenção

### **4. Naming Conventions**
- `I` prefix para interfaces (ex: `IClientRepository`)
- `Contract` suffix para contratos (ex: `ClientContract`)
- `Config` suffix para configurações (ex: `MapConfig`)

## 📋 Checklist de Implementação

- [ ] Criar estrutura de pastas
- [ ] Implementar interfaces de Repository
- [ ] Implementar interfaces de Domain Services
- [ ] Implementar interfaces de Componentes
- [ ] Implementar interfaces de Estado
- [ ] Implementar interfaces de Configuração
- [ ] Refatorar Services existentes
- [ ] Refatorar Componentes existentes
- [ ] Criar testes para interfaces
- [ ] Documentar interfaces





