# Health Connect Integration Setup

## Visão Geral

Esta integração permite que o app Exercita-68 colete dados de saúde diretamente do dispositivo Android usando o Health Connect, substituindo a integração anterior com Google Fit.

## Funcionalidades

- ✅ Conexão com Health Connect (Android)
- ✅ Coleta de dados de passos, frequência cardíaca, sono e calorias
- ✅ Sincronização automática com o banco de dados
- ✅ Interface para visualização de dados em gráficos
- ✅ Gerenciamento de permissões
- ✅ Painel admin para configuração

## Setup para Desenvolvimento

### 1. Instalar Dependências do Capacitor

As dependências já foram instaladas:
- @capacitor/core
- @capacitor/cli  
- @capacitor/android
- @capacitor/ios

### 2. Configuração Android

#### Arquivos Criados:
- `capacitor.config.ts` - Configuração principal do Capacitor
- `android/variables.gradle` - Variáveis de versão
- `android/app/build.gradle` - Build configuration com Health Connect
- `android/app/src/main/AndroidManifest.xml` - Permissões e visibilidade do Health Connect
- `android/app/src/main/java/.../HealthConnectPlugin.java` - Plugin nativo

#### Permissões Configuradas:
- `android.permission.health.READ_STEPS`
- `android.permission.health.READ_HEART_RATE`
- `android.permission.health.READ_SLEEP`
- `android.permission.health.READ_TOTAL_CALORIES_BURNED`

### 3. Estrutura de Código

#### Plugins:
- `src/plugins/HealthConnect.ts` - Interface TypeScript
- `src/plugins/HealthConnectWeb.ts` - Fallback para web

#### Hooks:
- `src/hooks/useHealthIntegration.tsx` - Hook principal (atualizado)
- `src/hooks/useHealthConnections.tsx` - Gerenciamento de conexões (atualizado)
- `src/hooks/useHealthSync.tsx` - Sincronização de dados (novo)

#### Componentes:
- `src/components/health/HealthIntegrationCard.tsx` - Card de integração (atualizado)
- `src/pages/Health.tsx` - Página principal de saúde (atualizada)
- `src/pages/admin/HealthIntegrationManagement.tsx` - Painel admin

## Testando a Integração

### 1. Preparar Projeto para Mobile

```bash
# 1. Exportar para GitHub via botão "Export to Github"
# 2. Fazer git pull do repositório
# 3. Instalar dependências
npm install

# 4. Adicionar plataforma Android
npx cap add android

# 5. Atualizar dependências nativas
npx cap update android

# 6. Build do projeto
npm run build

# 7. Sincronizar com Android
npx cap sync

# 8. Executar no Android
npx cap run android
```

### 2. Testar no Dispositivo

1. Instalar Health Connect no dispositivo Android
2. Configurar dados de saúde no Health Connect
3. Abrir o app Exercita-68
4. Ir para "Saúde" no menu
5. Clicar em "Conectar" no card Health Connect
6. Conceder permissões quando solicitado
7. Testar sincronização clicando em "Sincronizar"

## Banco de Dados

### Tabelas Existentes:
- `health_data` - Armazena dados de saúde do usuário
- `health_connections` - Gerencia conexões com provedores
- `health_provider_settings` - Configurações de provedores
- `health_sync_logs` - Logs de sincronização

### Edge Functions:
- `health-sync` - Processa sincronização de dados
- `health-oauth` - Gerencia OAuth (para outros provedores)

## Recursos de Segurança

- RLS (Row Level Security) habilitado em todas as tabelas
- Autenticação obrigatória para acesso aos dados
- Permissions baseadas em roles (admin/super_admin)
- Criptografia de tokens de acesso

## Próximos Passos

1. Testar em dispositivo físico Android
2. Configurar sincronização automática em background
3. Adicionar mais métricas de saúde conforme necessário
4. Implementar notificações para lembrar usuários de sincronizar

## Documentação

Para mais informações sobre desenvolvimento mobile com Capacitor, consulte:
https://lovable.dev/blogs/TODO