-- Create health connections table to track user connections to health services
CREATE TABLE public.health_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('apple_health', 'google_fit', 'samsung_health')),
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error', 'pending')),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_frequency_minutes INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Create health provider settings table for Super Admin management
CREATE TABLE public.health_provider_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL UNIQUE CHECK (provider IN ('apple_health', 'google_fit', 'samsung_health')),
  is_enabled BOOLEAN DEFAULT false,
  client_id TEXT,
  client_secret TEXT,
  api_key TEXT,
  redirect_uri TEXT,
  scopes JSONB,
  additional_config JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create health sync logs table for tracking synchronization
CREATE TABLE public.health_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES public.health_connections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL,
  sync_type TEXT NOT NULL DEFAULT 'automatic' CHECK (sync_type IN ('automatic', 'manual', 'initial')),
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  records_synced INTEGER DEFAULT 0,
  error_message TEXT,
  sync_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sync_completed_at TIMESTAMP WITH TIME ZONE,
  data_range_start DATE,
  data_range_end DATE
);

-- Enable RLS on all health tables
ALTER TABLE public.health_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_provider_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for health_connections
CREATE POLICY "Users can view their own health connections" 
ON public.health_connections 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own health connections" 
ON public.health_connections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health connections" 
ON public.health_connections 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all health connections" 
ON public.health_connections 
FOR ALL 
USING (is_admin());

-- RLS policies for health_provider_settings
CREATE POLICY "Only super admins can manage health provider settings" 
ON public.health_provider_settings 
FOR ALL 
USING (is_super_admin());

-- RLS policies for health_sync_logs
CREATE POLICY "Users can view their own sync logs" 
ON public.health_sync_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sync logs" 
ON public.health_sync_logs 
FOR ALL 
USING (is_admin());

-- Insert default provider settings
INSERT INTO public.health_provider_settings (provider, is_enabled, scopes) VALUES
('apple_health', false, '["health_data_read"]'::jsonb),
('google_fit', false, '["https://www.googleapis.com/auth/fitness.activity.read", "https://www.googleapis.com/auth/fitness.heart_rate.read"]'::jsonb),
('samsung_health', false, '["com.samsung.health.step_count", "com.samsung.health.heart_rate"]'::jsonb);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_health_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_health_connections_updated_at
BEFORE UPDATE ON public.health_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_health_updated_at_column();

CREATE TRIGGER update_health_provider_settings_updated_at
BEFORE UPDATE ON public.health_provider_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_health_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_health_connections_user_provider ON public.health_connections(user_id, provider);
CREATE INDEX idx_health_connections_status ON public.health_connections(status);
CREATE INDEX idx_health_sync_logs_connection_id ON public.health_sync_logs(connection_id);
CREATE INDEX idx_health_sync_logs_user_provider ON public.health_sync_logs(user_id, provider);
CREATE INDEX idx_health_data_user_date ON public.health_data(user_id, date);