# Exercita Health Companion App

Um aplicativo companheiro nativo para Android e iOS que sincroniza dados de saúde locais com a API web do Exercita de forma segura.

## 📱 Funcionalidades

### Android (Health Connect)
- Integração com Health Connect para acesso aos dados de saúde
- Coleta de passos, frequência cardíaca, sono e calorias
- Sincronização automática diária via WorkManager
- Armazenamento seguro de credenciais com EncryptedSharedPreferences
- Autenticação HMAC SHA-256 para segurança da API

### iOS (HealthKit)
- Integração com HealthKit para acesso aos dados de saúde
- Coleta dos mesmos tipos de dados que Android
- Sincronização em segundo plano via BGAppRefreshTask
- Armazenamento seguro no Keychain
- Mesma autenticação HMAC SHA-256

## 🔧 Configuração

### Pré-requisitos
- Conta ativa no app web Exercita
- Token JWT válido obtido do app principal
- Dispositivo com Health Connect (Android 14+) ou HealthKit (iOS 8+)

### Instalação Android

1. **Dependências no `build.gradle`:**
```gradle
dependencies {
    implementation 'androidx.health.connect:connect-client:1.0.0-alpha11'
    implementation 'androidx.security:security-crypto:1.1.0-alpha06'
    implementation 'androidx.work:work-runtime:2.8.1'
    implementation 'com.squareup.okhttp3:okhttp:4.11.0'
}
```

2. **Permissões no `AndroidManifest.xml`:**
```xml
<uses-permission android:name="android.permission.health.READ_STEPS" />
<uses-permission android:name="android.permission.health.READ_HEART_RATE" />
<uses-permission android:name="android.permission.health.READ_SLEEP" />
<uses-permission android:name="android.permission.health.READ_TOTAL_CALORIES_BURNED" />

<queries>
    <package android:name="com.google.android.apps.healthdata" />
</queries>
```

3. **Configuração inicial:**
   - Instale o Health Connect do Google Play Store
   - Abra o app Exercita Health Companion
   - Conecte com Health Connect
   - Cole o token JWT do app principal
   - Confirme as permissões de dados de saúde

### Instalação iOS

1. **Capacidades no Xcode:**
   - Habilite HealthKit capability
   - Configure Background App Refresh
   - Adicione BGTaskScheduler identifier

2. **Info.plist:**
```xml
<key>NSHealthShareUsageDescription</key>
<string>Este app precisa acessar seus dados de saúde para sincronizar com o Exercita.</string>
<key>NSHealthUpdateUsageDescription</key>
<string>Este app precisa acessar seus dados de saúde para sincronizar com o Exercita.</string>
```

3. **Configuração inicial:**
   - Abra o app Exercita Health Companion
   - Autorize acesso ao HealthKit
   - Cole o token JWT do app principal
   - Confirme as permissões de dados de saúde

## 🔐 Segurança

### Autenticação e Autorização
- **JWT Token**: Obtido do app principal, validado pelo servidor
- **HMAC SHA-256**: Cada requisição é assinada com chave secreta única
- **Idempotency Keys**: Previne duplicação de dados
- **Armazenamento Seguro**: Keychain (iOS) / EncryptedSharedPreferences (Android)

### Fluxo de Segurança
1. **Registro do Dispositivo**: `POST /api/health/register-device`
   - Headers: `Authorization: Bearer <JWT>`
   - Body: `{ deviceId, platform, consents }`
   - Resposta: `{ hmacSecret }`

2. **Sincronização de Dados**: `POST /api/health/sync`
   - Headers: 
     - `Authorization: Bearer <JWT>`
     - `X-Signature: sha256=<HMAC>`
     - `X-Idempotency-Key: <UUID>`
   - Body: `{ deviceId, platform, window: {from, to}, data: [...] }`

### Validação HMAC
```javascript
// Servidor valida assinatura
const expectedSignature = hmac_sha256(requestBody, deviceSecret)
const isValid = providedSignature === expectedSignature
```

## 📊 Estrutura de Dados

### Dados Coletados (7 dias)
```json
{
  "deviceId": "uuid",
  "platform": "android|ios", 
  "window": {
    "from": "2024-01-01",
    "to": "2024-01-07"
  },
  "data": [
    {
      "date": "2024-01-01",
      "steps": 8500,
      "heart_rate": 72,
      "sleep_hours": 7.5,
      "calories": 2200
    }
  ]
}
```

### Tabelas do Banco de Dados

**device_keys**: Armazena chaves HMAC e metadados de dispositivos
**health_consents**: Rastreia permissões de cada tipo de dado
**health_sync_logs**: Log completo de todas as sincronizações
**health_data**: Dados de saúde agregados por dia

## 🔄 Sincronização

### Automática
- **Android**: WorkManager executa diariamente quando há rede
- **iOS**: BGAppRefreshTask executa conforme políticas do sistema
- **Horário**: Preferencialmente durante a madrugada
- **Condições**: Requer conexão de rede ativa

### Manual
- Botão "Sincronizar Agora" disponível na interface
- Execução imediata quando solicitada pelo usuário
- Feedback visual durante o processo

### Rate Limiting
- Máximo 1 sincronização por hora por dispositivo
- Servidor rejeita tentativas excessivas
- Idempotency keys previnem duplicações

## 🛠️ API Endpoints

### Registro de Dispositivo
```
POST /api/health/register-device
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "deviceId": "uuid",
  "platform": "android|ios",
  "deviceName": "iPhone 15 Pro",
  "appVersion": "1.0.0",
  "consents": {
    "steps": true,
    "heart_rate": true,
    "sleep": true,
    "calories": true
  }
}

Response:
{
  "success": true,
  "deviceId": "uuid",
  "hmacSecret": "hex_string",
  "message": "Device registered successfully"
}
```

### Sincronização de Dados
```
POST /api/health/sync
Authorization: Bearer <JWT>
X-Signature: sha256=<hmac_hex>
X-Idempotency-Key: <uuid>
Content-Type: application/json

{
  "deviceId": "uuid",
  "platform": "android|ios",
  "window": {"from": "2024-01-01", "to": "2024-01-07"},
  "data": [...]
}

Response:
{
  "message": "Health data sync completed",
  "syncLogId": "uuid",
  "summary": {
    "total": 7,
    "successful": 7,
    "failed": 0
  }
}
```

## 📱 Interface do Usuário

### Tela Principal
1. **Status da Conexão**
   - Verde: Dispositivo registrado e funcional
   - Laranja: Conectado mas não registrado
   - Vermelho: Sem permissões de saúde

2. **Última Sincronização**
   - Data/hora da última sincronização bem-sucedida
   - Oculta se nunca sincronizou

3. **Botões de Ação**
   - "Conectar Health Connect/HealthKit": Solicita permissões
   - "Registrar Dispositivo": Inicia processo de registro
   - "Sincronizar Agora": Força sincronização manual

### Feedback Visual
- Indicadores de progresso durante operações
- Mensagens de sucesso/erro com detalhes
- Status em tempo real das operações

## 🧪 Testes

### Testes Unitários
```bash
# Android
./gradlew testDebugUnitTest

# iOS  
xcodebuild test -scheme HealthCompanionApp
```

### Testes de Integração
- Verificar fluxo completo de registro
- Testar sincronização com dados reais
- Validar autenticação HMAC
- Confirmar armazenamento seguro

### Checklist de QA
- [ ] Permissões de saúde solicitadas corretamente
- [ ] Registro de dispositivo funcional
- [ ] Sincronização automática operacional  
- [ ] Sincronização manual responsiva
- [ ] Dados armazenados com segurança
- [ ] Interface responsiva e acessível
- [ ] Tratamento de erros adequado
- [ ] Background sync funciona (iOS)
- [ ] WorkManager agendado corretamente (Android)
- [ ] HMAC validation no servidor

## 🔧 Troubleshooting

### Problemas Comuns

**"Health Connect não disponível"**
- Instale Health Connect do Google Play Store
- Verifique se o dispositivo é compatível (Android 14+)

**"Permissões negadas"**
- Abra Health Connect > Permissões > Exercita Health
- Habilite acesso a dados solicitados

**"Token JWT inválido"**
- Obtenha novo token do app principal
- Verifique se não expirou (válido por 24h)

**"Falha na sincronização"**
- Verifique conexão com internet
- Confirme se dispositivo está registrado
- Reinstale o app se necessário

### Logs de Debug
```bash
# Android
adb logcat | grep "HealthSyncService\|HealthConnectPlugin"

# iOS
Console app > Device > Your iPhone > Search "HealthKit"
```

## 📞 Suporte

Para suporte técnico ou dúvidas sobre integração:
- Email: suporte@exercita.com
- Documentação completa: https://docs.exercita.com/health-sync
- GitHub Issues: https://github.com/exercita/companion-app/issues

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.