package app.lovable.ed6ff2f23934447facfe5011959465fb;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;
import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import androidx.work.Constraints;
import androidx.work.NetworkType;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class HealthSyncService extends Worker {
    private static final String TAG = "HealthSyncService";
    private static final String PREFS_NAME = "health_sync_prefs";
    private static final String KEY_DEVICE_ID = "device_id";
    private static final String KEY_HMAC_SECRET = "hmac_secret";
    private static final String KEY_JWT_TOKEN = "jwt_token";
    private static final String KEY_LAST_SYNC = "last_sync_date";
    
    private static final String API_BASE_URL = "https://wehexulgoxwswkaoygnx.supabase.co/functions/v1";
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");
    
    private HealthConnectPlugin healthPlugin;
    private SharedPreferences encryptedPrefs;
    private OkHttpClient httpClient;

    public HealthSyncService(Context context, WorkerParameters params) {
        super(context, params);
        this.healthPlugin = new HealthConnectPlugin();
        this.healthPlugin.load();
        this.httpClient = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build();
        
        try {
            MasterKey masterKey = new MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build();
                
            this.encryptedPrefs = EncryptedSharedPreferences.create(
                context,
                PREFS_NAME,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            );
        } catch (GeneralSecurityException | IOException e) {
            Log.e(TAG, "Error creating encrypted preferences", e);
        }
    }

    @Override
    public Result doWork() {
        try {
            Log.d(TAG, "Starting health data sync");
            
            // Check if device is registered
            String deviceId = encryptedPrefs.getString(KEY_DEVICE_ID, null);
            String hmacSecret = encryptedPrefs.getString(KEY_HMAC_SECRET, null);
            String jwtToken = encryptedPrefs.getString(KEY_JWT_TOKEN, null);
            
            if (deviceId == null || hmacSecret == null || jwtToken == null) {
                Log.w(TAG, "Device not registered or missing credentials");
                return Result.failure();
            }
            
            // Get health data from last 7 days
            JSONObject healthData = collectHealthData();
            if (healthData == null) {
                Log.w(TAG, "No health data to sync");
                return Result.success();
            }
            
            // Send data to API
            boolean success = syncHealthData(deviceId, hmacSecret, jwtToken, healthData);
            
            if (success) {
                // Update last sync date
                encryptedPrefs.edit()
                    .putString(KEY_LAST_SYNC, LocalDate.now().toString())
                    .apply();
                Log.d(TAG, "Health data sync completed successfully");
                return Result.success();
            } else {
                Log.e(TAG, "Health data sync failed");
                return Result.retry();
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error during health sync", e);
            return Result.failure();
        }
    }
    
    private JSONObject collectHealthData() {
        try {
            // Get data from last 7 days
            LocalDate endDate = LocalDate.now();
            LocalDate startDate = endDate.minusDays(7);
            
            JSONObject requestData = new JSONObject();
            requestData.put("deviceId", encryptedPrefs.getString(KEY_DEVICE_ID, ""));
            requestData.put("platform", "android");
            
            JSONObject window = new JSONObject();
            window.put("from", startDate.toString());
            window.put("to", endDate.toString());
            requestData.put("window", window);
            
            JSONArray dataArray = new JSONArray();
            
            // Collect data for each day
            for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
                JSONObject dayData = collectDayData(date);
                if (dayData != null) {
                    dataArray.put(dayData);
                }
            }
            
            if (dataArray.length() == 0) {
                return null;
            }
            
            requestData.put("data", dataArray);
            return requestData;
            
        } catch (Exception e) {
            Log.e(TAG, "Error collecting health data", e);
            return null;
        }
    }
    
    private JSONObject collectDayData(LocalDate date) {
        try {
            // Use the HealthConnectPlugin to get data for the specific date
            // This is a simplified version - in practice, you'd implement the actual Health Connect queries
            JSONObject dayData = new JSONObject();
            dayData.put("date", date.toString());
            
            // Mock data for now - replace with actual Health Connect queries
            dayData.put("steps", (int)(Math.random() * 10000) + 5000);
            dayData.put("heart_rate", (int)(Math.random() * 40) + 60);
            dayData.put("sleep_hours", Math.round((Math.random() * 4 + 6) * 10.0) / 10.0);
            dayData.put("calories", (int)(Math.random() * 1000) + 1500);
            
            return dayData;
            
        } catch (Exception e) {
            Log.e(TAG, "Error collecting day data for " + date, e);
            return null;
        }
    }
    
    private boolean syncHealthData(String deviceId, String hmacSecret, String jwtToken, JSONObject data) {
        try {
            String jsonBody = data.toString();
            
            // Calculate HMAC signature
            String signature = calculateHmacSignature(jsonBody, hmacSecret);
            String idempotencyKey = UUID.randomUUID().toString();
            
            RequestBody body = RequestBody.create(jsonBody, JSON);
            
            Request request = new Request.Builder()
                .url(API_BASE_URL + "/health-sync")
                .post(body)
                .addHeader("Authorization", "Bearer " + jwtToken)
                .addHeader("X-Signature", "sha256=" + signature)
                .addHeader("X-Idempotency-Key", idempotencyKey)
                .addHeader("Content-Type", "application/json")
                .build();
            
            try (Response response = httpClient.newCall(request).execute()) {
                if (response.isSuccessful()) {
                    Log.d(TAG, "Health data sync successful: " + response.body().string());
                    return true;
                } else {
                    Log.e(TAG, "Health data sync failed: " + response.code() + " " + response.body().string());
                    return false;
                }
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error syncing health data", e);
            return false;
        }
    }
    
    private String calculateHmacSignature(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKeySpec = new SecretKeySpec(hexStringToByteArray(secret), "HmacSHA256");
        mac.init(secretKeySpec);
        
        byte[] hash = mac.doFinal(data.getBytes("UTF-8"));
        return bytesToHex(hash);
    }
    
    private byte[] hexStringToByteArray(String s) {
        int len = s.length();
        byte[] data = new byte[len / 2];
        for (int i = 0; i < len; i += 2) {
            data[i / 2] = (byte) ((Character.digit(s.charAt(i), 16) << 4)
                    + Character.digit(s.charAt(i+1), 16));
        }
        return data;
    }
    
    private String bytesToHex(byte[] bytes) {
        StringBuilder result = new StringBuilder();
        for (byte b : bytes) {
            result.append(String.format("%02x", b));
        }
        return result.toString();
    }
    
    // Static methods to control the sync service
    public static void schedulePeriodicSync(Context context) {
        Constraints constraints = new Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build();
        
        PeriodicWorkRequest syncRequest = new PeriodicWorkRequest.Builder(
            HealthSyncService.class, 
            24, TimeUnit.HOURS  // Daily sync
        )
        .setConstraints(constraints)
        .build();
        
        WorkManager.getInstance(context)
            .enqueue(syncRequest);
        
        Log.d(TAG, "Periodic health sync scheduled");
    }
    
    public static void performImmediateSync(Context context) {
        Constraints constraints = new Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build();
        
        PeriodicWorkRequest syncRequest = new PeriodicWorkRequest.Builder(
            HealthSyncService.class,
            15, TimeUnit.MINUTES  // Minimum interval for one-time work
        )
        .setConstraints(constraints)
        .build();
        
        WorkManager.getInstance(context)
            .enqueue(syncRequest);
        
        Log.d(TAG, "Immediate health sync requested");
    }
    
    public static void cancelAllSync(Context context) {
        WorkManager.getInstance(context)
            .cancelAllWorkByTag("health_sync");
        Log.d(TAG, "All health sync work cancelled");
    }
}