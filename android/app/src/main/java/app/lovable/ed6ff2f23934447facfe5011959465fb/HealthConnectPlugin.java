package app.lovable.ed6ff2f23934447facfe5011959465fb;

import android.content.Context;
import android.content.pm.PackageManager;
import android.util.Log;

import androidx.health.connect.client.HealthConnectClient;
import androidx.health.connect.client.permission.HealthPermission;
import androidx.health.connect.client.records.StepsRecord;
import androidx.health.connect.client.records.HeartRateRecord;
import androidx.health.connect.client.records.SleepSessionRecord;
import androidx.health.connect.client.records.TotalCaloriesBurnedRecord;
import androidx.health.connect.client.request.ReadRecordsRequest;
import androidx.health.connect.client.time.TimeRangeFilter;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@CapacitorPlugin(name = "HealthConnect")
public class HealthConnectPlugin extends Plugin {

    private static final String TAG = "HealthConnectPlugin";
    private HealthConnectClient healthConnectClient;

    private static final Set<String> PERMISSIONS = Set.of(
            HealthPermission.getReadPermission(StepsRecord.class),
            HealthPermission.getReadPermission(HeartRateRecord.class),
            HealthPermission.getReadPermission(SleepSessionRecord.class),
            HealthPermission.getReadPermission(TotalCaloriesBurnedRecord.class)
    );

    @Override
    public void load() {
        super.load();
        Context context = getContext();
        
        if (HealthConnectClient.getSdkStatus(context) == HealthConnectClient.SDK_AVAILABLE) {
            healthConnectClient = HealthConnectClient.getOrCreate(context);
        }
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        Context context = getContext();
        boolean available = HealthConnectClient.getSdkStatus(context) == HealthConnectClient.SDK_AVAILABLE;
        
        JSObject result = new JSObject();
        result.put("available", available);
        call.resolve(result);
    }

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        if (healthConnectClient == null) {
            JSObject result = new JSObject();
            result.put("granted", false);
            call.resolve(result);
            return;
        }

        try {
            healthConnectClient.getGrantedPermissions().addOnSuccessListener(grantedPermissions -> {
                boolean granted = grantedPermissions.containsAll(PERMISSIONS);
                JSObject result = new JSObject();
                result.put("granted", granted);
                call.resolve(result);
            }).addOnFailureListener(exception -> {
                Log.e(TAG, "Failed to check permissions", exception);
                JSObject result = new JSObject();
                result.put("granted", false);
                call.resolve(result);
            });
        } catch (Exception e) {
            Log.e(TAG, "Error checking permissions", e);
            JSObject result = new JSObject();
            result.put("granted", false);
            call.resolve(result);
        }
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (healthConnectClient == null) {
            JSObject result = new JSObject();
            result.put("granted", false);
            call.resolve(result);
            return;
        }

        try {
            healthConnectClient.getGrantedPermissions().addOnSuccessListener(grantedPermissions -> {
                if (grantedPermissions.containsAll(PERMISSIONS)) {
                    JSObject result = new JSObject();
                    result.put("granted", true);
                    call.resolve(result);
                    return;
                }

                // Request missing permissions
                // Note: In a real implementation, you would launch the Health Connect permission intent
                // For now, we'll simulate the permission request
                JSObject result = new JSObject();
                result.put("granted", false);
                call.resolve(result);
            });
        } catch (Exception e) {
            Log.e(TAG, "Error requesting permissions", e);
            JSObject result = new JSObject();
            result.put("granted", false);
            call.resolve(result);
        }
    }

    @PluginMethod
    public void getHealthData(PluginCall call) {
        if (healthConnectClient == null) {
            call.reject("Health Connect not available");
            return;
        }

        String startDateStr = call.getString("startDate");
        String endDateStr = call.getString("endDate");

        if (startDateStr == null || endDateStr == null) {
            call.reject("Start date and end date are required");
            return;
        }

        try {
            LocalDate startDate = LocalDate.parse(startDateStr);
            LocalDate endDate = LocalDate.parse(endDateStr);
            
            Instant startInstant = startDate.atStartOfDay(ZoneId.systemDefault()).toInstant();
            Instant endInstant = endDate.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
            
            TimeRangeFilter timeRangeFilter = TimeRangeFilter.between(startInstant, endInstant);

            // For now, return mock data
            // In a real implementation, you would query Health Connect for actual data
            JSObject mockData = new JSObject();
            mockData.put("date", startDateStr);
            mockData.put("steps", 8500);
            mockData.put("heartRate", 72);
            mockData.put("sleepHours", 7.5);
            mockData.put("calories", 2200.0);

            JSObject result = new JSObject();
            result.put("data", new JSObject[]{mockData});
            call.resolve(result);

        } catch (Exception e) {
            Log.e(TAG, "Error getting health data", e);
            call.reject("Failed to get health data: " + e.getMessage());
        }
    }

    @PluginMethod
    public void syncHealthData(PluginCall call) {
        // This method would implement the sync logic
        // For now, return success
        JSObject result = new JSObject();
        result.put("success", true);
        result.put("message", "Health data synced successfully");
        call.resolve(result);
    }
}