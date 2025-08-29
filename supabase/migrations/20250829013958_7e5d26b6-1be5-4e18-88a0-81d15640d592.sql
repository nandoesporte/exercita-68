-- Create device_keys table for storing HMAC secrets
CREATE TABLE device_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('android', 'ios')),
  hmac_secret TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  device_name TEXT,
  app_version TEXT,
  UNIQUE(user_id, device_id, platform)
);

-- Create health_consents table for tracking user permissions
CREATE TABLE health_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('android', 'ios')),
  consent_type TEXT NOT NULL CHECK (consent_type IN ('steps', 'heart_rate', 'sleep', 'calories')),
  granted BOOLEAN NOT NULL DEFAULT false,
  granted_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, device_id, platform, consent_type)
);

-- Update health_sync_logs table to include device info and HMAC validation
ALTER TABLE health_sync_logs ADD COLUMN IF NOT EXISTS device_id TEXT;
ALTER TABLE health_sync_logs ADD COLUMN IF NOT EXISTS platform TEXT;
ALTER TABLE health_sync_logs ADD COLUMN IF NOT EXISTS hmac_valid BOOLEAN;
ALTER TABLE health_sync_logs ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
ALTER TABLE health_sync_logs ADD COLUMN IF NOT EXISTS app_version TEXT;

-- Enable RLS on new tables
ALTER TABLE device_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_consents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for device_keys
CREATE POLICY "Users can view their own device keys" 
ON device_keys 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own device keys" 
ON device_keys 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own device keys" 
ON device_keys 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all device keys" 
ON device_keys 
FOR ALL 
USING (is_admin());

-- Create RLS policies for health_consents
CREATE POLICY "Users can view their own consents" 
ON health_consents 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own consents" 
ON health_consents 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consents" 
ON health_consents 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all consents" 
ON health_consents 
FOR ALL 
USING (is_admin());

-- Create indexes for better performance
CREATE INDEX idx_device_keys_user_id ON device_keys(user_id);
CREATE INDEX idx_device_keys_device_id ON device_keys(device_id);
CREATE INDEX idx_health_consents_user_id ON health_consents(user_id);
CREATE INDEX idx_health_consents_device_id ON health_consents(device_id);
CREATE INDEX idx_health_sync_logs_device_id ON health_sync_logs(device_id);

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_device_keys_updated_at
  BEFORE UPDATE ON device_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_consents_updated_at
  BEFORE UPDATE ON health_consents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();