package app.lovable.ed6ff2f23934447facfe5011959465fb;

import android.content.Intent;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;

@CapacitorPlugin(name = "HealthCompanionLauncher")
public class HealthCompanionLauncherPlugin extends Plugin {

    @PluginMethod
    public void launch(PluginCall call) {
        String jwtToken = call.getString("jwtToken");
        
        if (jwtToken == null || jwtToken.isEmpty()) {
            JSObject ret = new JSObject();
            ret.put("success", false);
            call.resolve(ret);
            return;
        }

        try {
            Intent intent = new Intent(getContext(), HealthCompanionActivity.class);
            intent.putExtra("JWT_TOKEN", jwtToken);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("success", false);
            call.resolve(ret);
        }
    }
}