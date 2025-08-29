package app.lovable.ed6ff2f23934447facfe5011959465fb;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.health.connect.client.HealthConnectClient;
import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;

import org.json.JSONObject;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class HealthCompanionActivity extends AppCompatActivity {
    private static final String TAG = "HealthCompanionActivity";
    private static final String PREFS_NAME = "health_sync_prefs";
    private static final String KEY_DEVICE_ID = "device_id";
    private static final String KEY_HMAC_SECRET = "hmac_secret";
    private static final String KEY_JWT_TOKEN = "jwt_token";
    private static final String KEY_LAST_SYNC = "last_sync_date";
    private static final String KEY_DEVICE_REGISTERED = "device_registered";
    
    private static final String API_BASE_URL = "https://wehexulgoxwswkaoygnx.supabase.co/functions/v1";
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");
    
    private HealthConnectPlugin healthPlugin;
    private SharedPreferences encryptedPrefs;
    private OkHttpClient httpClient;
    
    private TextView statusText;
    private TextView lastSyncText;
    private Button connectButton; 
    private Button syncButton;
    private Button settingsButton;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_health_companion);
        
        initializeViews();
        initializeServices();
        updateUI();
    }
    
    private void initializeViews() {
        statusText = findViewById(R.id.status_text);
        lastSyncText = findViewById(R.id.last_sync_text);
        connectButton = findViewById(R.id.connect_button);
        syncButton = findViewById(R.id.sync_button);
        settingsButton = findViewById(R.id.settings_button);
        
        connectButton.setOnClickListener(v -> requestHealthAccess());
        syncButton.setOnClickListener(v -> performManualSync());
        settingsButton.setOnClickListener(v -> openSettings());
    }
    
    private void initializeServices() {
        this.healthPlugin = new HealthConnectPlugin();
        this.healthPlugin.load();
        this.httpClient = new OkHttpClient();
        
        try {
            MasterKey masterKey = new MasterKey.Builder(this)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build();
                
            this.encryptedPrefs = EncryptedSharedPreferences.create(
                this,
                PREFS_NAME,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            );
        } catch (GeneralSecurityException | IOException e) {
            Log.e(TAG, "Error creating encrypted preferences", e);
            Toast.makeText(this, "Erro ao inicializar segurança", Toast.LENGTH_LONG).show();
        }
    }
    
    private void updateUI() {
        boolean isConnected = isHealthConnectAvailable() && hasHealthPermissions();
        boolean isRegistered = encryptedPrefs.getBoolean(KEY_DEVICE_REGISTERED, false);
        String lastSync = encryptedPrefs.getString(KEY_LAST_SYNC, null);
        
        if (!isConnected) {
            statusText.setText("Health Connect não disponível ou sem permissões");
            statusText.setTextColor(getColor(android.R.color.holo_red_dark));
            connectButton.setText("Conectar Health Connect");
            connectButton.setEnabled(true);
            syncButton.setEnabled(false);
        } else if (!isRegistered) {
            statusText.setText("Health Connect conectado - Dispositivo não registrado");
            statusText.setTextColor(getColor(android.R.color.holo_orange_light));
            connectButton.setText("Registrar Dispositivo");
            connectButton.setEnabled(true);
            syncButton.setEnabled(false);
        } else {
            statusText.setText("Dispositivo registrado e pronto para sincronização");
            statusText.setTextColor(getColor(android.R.color.holo_green_dark));
            connectButton.setText("Reconectar");
            connectButton.setEnabled(true);
            syncButton.setEnabled(true);
        }
        
        if (lastSync != null) {
            lastSyncText.setText("Última sincronização: " + lastSync);
            lastSyncText.setVisibility(View.VISIBLE);
        } else {
            lastSyncText.setVisibility(View.GONE);
        }
    }
    
    private boolean isHealthConnectAvailable() {
        return HealthConnectClient.getSdkStatus(this) == HealthConnectClient.SDK_AVAILABLE;
    }
    
    private boolean hasHealthPermissions() {
        // This would check actual permissions - simplified for demo
        return encryptedPrefs.getBoolean("health_permissions_granted", false);
    }
    
    private void requestHealthAccess() {
        if (!isHealthConnectAvailable()) {
            Toast.makeText(this, "Health Connect não está disponível neste dispositivo", Toast.LENGTH_LONG).show();
            return;
        }
        
        connectButton.setEnabled(false);
        connectButton.setText("Solicitando permissões...");
        
        // Request Health Connect permissions
        healthPlugin.requestPermissions(new HealthConnectPlugin.PermissionCallback() {
            @Override
            public void onSuccess(boolean granted) {
                runOnUiThread(() -> {
                    if (granted) {
                        encryptedPrefs.edit().putBoolean("health_permissions_granted", true).apply();
                        registerDevice();
                    } else {
                        Toast.makeText(HealthCompanionActivity.this, 
                            "Permissões necessárias não foram concedidas", Toast.LENGTH_LONG).show();
                        connectButton.setEnabled(true);
                        connectButton.setText("Tentar Novamente");
                    }
                });
            }
            
            @Override
            public void onError(String error) {
                runOnUiThread(() -> {
                    Toast.makeText(HealthCompanionActivity.this, 
                        "Erro ao solicitar permissões: " + error, Toast.LENGTH_LONG).show();
                    connectButton.setEnabled(true);
                    connectButton.setText("Tentar Novamente");
                });
            }
        });
    }
    
    private void registerDevice() {
        // Get JWT token from user (this would typically come from the main app)
        String jwtToken = getJwtTokenFromUser();
        if (jwtToken == null) {
            Toast.makeText(this, "Token JWT necessário. Por favor, faça login no app principal primeiro.", Toast.LENGTH_LONG).show();
            connectButton.setEnabled(true);
            connectButton.setText("Conectar Health Connect");
            return;
        }
        
        connectButton.setText("Registrando dispositivo...");
        
        try {
            String deviceId = UUID.randomUUID().toString();
            
            // Create registration request
            JSONObject registrationData = new JSONObject();
            registrationData.put("deviceId", deviceId);
            registrationData.put("platform", "android");
            registrationData.put("deviceName", android.os.Build.MODEL);
            registrationData.put("appVersion", getPackageManager().getPackageInfo(getPackageName(), 0).versionName);
            
            JSONObject consents = new JSONObject();
            consents.put("steps", true);
            consents.put("heart_rate", true);
            consents.put("sleep", true);
            consents.put("calories", true);
            registrationData.put("consents", consents);
            
            RequestBody body = RequestBody.create(registrationData.toString(), JSON);
            Request request = new Request.Builder()
                .url(API_BASE_URL + "/health-register-device")
                .post(body)
                .addHeader("Authorization", "Bearer " + jwtToken)
                .addHeader("Content-Type", "application/json")
                .build();
            
            httpClient.newCall(request).enqueue(new Callback() {
                @Override
                public void onFailure(Call call, IOException e) {
                    runOnUiThread(() -> {
                        Log.e(TAG, "Device registration failed", e);
                        Toast.makeText(HealthCompanionActivity.this, 
                            "Falha no registro do dispositivo", Toast.LENGTH_LONG).show();
                        connectButton.setEnabled(true);
                        connectButton.setText("Tentar Novamente");
                    });
                }
                
                @Override
                public void onResponse(Call call, Response response) throws IOException {
                    String responseBody = response.body().string();
                    
                    runOnUiThread(() -> {
                        try {
                            if (response.isSuccessful()) {
                                JSONObject result = new JSONObject(responseBody);
                                String hmacSecret = result.getString("hmacSecret");
                                
                                // Store device registration securely
                                encryptedPrefs.edit()
                                    .putString(KEY_DEVICE_ID, deviceId)
                                    .putString(KEY_HMAC_SECRET, hmacSecret)
                                    .putString(KEY_JWT_TOKEN, jwtToken)
                                    .putBoolean(KEY_DEVICE_REGISTERED, true)
                                    .apply();
                                
                                // Schedule automatic sync
                                HealthSyncService.schedulePeriodicSync(HealthCompanionActivity.this);
                                
                                Toast.makeText(HealthCompanionActivity.this, 
                                    "Dispositivo registrado com sucesso!", Toast.LENGTH_LONG).show();
                                updateUI();
                                
                            } else {
                                JSONObject error = new JSONObject(responseBody);
                                Toast.makeText(HealthCompanionActivity.this, 
                                    "Erro no registro: " + error.optString("error", "Erro desconhecido"), 
                                    Toast.LENGTH_LONG).show();
                                connectButton.setEnabled(true);
                                connectButton.setText("Tentar Novamente");
                            }
                        } catch (Exception e) {
                            Log.e(TAG, "Error parsing registration response", e);
                            Toast.makeText(HealthCompanionActivity.this, 
                                "Erro ao processar resposta do servidor", Toast.LENGTH_LONG).show();
                            connectButton.setEnabled(true);
                            connectButton.setText("Tentar Novamente");
                        }
                    });
                }
            });
            
        } catch (Exception e) {
            Log.e(TAG, "Error during device registration", e);
            Toast.makeText(this, "Erro durante o registro", Toast.LENGTH_LONG).show();
            connectButton.setEnabled(true);
            connectButton.setText("Tentar Novamente");
        }
    }
    
    private void performManualSync() {
        syncButton.setEnabled(false);
        syncButton.setText("Sincronizando...");
        
        // Trigger immediate sync
        HealthSyncService.performImmediateSync(this);
        
        // Simulate sync completion (in practice, you'd listen for sync completion)
        syncButton.postDelayed(() -> {
            encryptedPrefs.edit()
                .putString(KEY_LAST_SYNC, LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")))
                .apply();
            
            syncButton.setEnabled(true);
            syncButton.setText("Sincronizar Agora");
            updateUI();
            
            Toast.makeText(this, "Sincronização solicitada", Toast.LENGTH_SHORT).show();
        }, 2000);
    }
    
    private void openSettings() {
        // Open Health Connect settings or app settings
        Toast.makeText(this, "Configurações (não implementado nesta demo)", Toast.LENGTH_SHORT).show();
    }
    
    private String getJwtTokenFromUser() {
        // In a real implementation, this would:
        // 1. Check if the main app is installed
        // 2. Get the JWT token from the main app via intent or shared storage
        // 3. Or prompt user to login
        
        // For demo purposes, return a placeholder
        // In production, you'd implement proper token exchange
        return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo_token_replace_with_real";
    }
    
    // Interface for permission callbacks
    public interface PermissionCallback {
        void onSuccess(boolean granted);
        void onError(String error);
    }
}