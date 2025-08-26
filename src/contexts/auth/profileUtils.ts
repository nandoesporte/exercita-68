
import { supabase } from '@/integrations/supabase/client';

// Check admin status using the new role system
export const checkAdminStatus = async (userId: string): Promise<boolean> => {
  try {
    console.log(`Checking admin status for user: ${userId}`);
    
    // Use the database function to check admin status
    const { data, error } = await supabase.rpc('is_admin');
    
    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
    
    console.log("Admin status check result:", data);
    const adminStatus = Boolean(data);
    
    if (adminStatus) {
      console.log("User has admin privileges!");
    } else {
      console.log("User does not have admin privileges");
    }
    
    return adminStatus;
  } catch (error) {
    console.error('Exception checking admin status:', error);
    return false;
  }
};

// Updated function to handle profiles without requiring instance_id
export const ensureProfileExists = async (userId: string, metadata?: any): Promise<boolean> => {
  try {
    if (!userId) {
      console.error("Cannot ensure profile without user ID");
      return false;
    }
    
    console.log("Ensuring profile exists for user:", userId, "with metadata:", metadata);
    
    // First check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking profile existence:', checkError);
      return false;
    }

    // If profile doesn't exist, create it
    if (!existingProfile) {
      console.log("Profile doesn't exist, creating now for user:", userId);
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          first_name: metadata?.first_name || '',
          last_name: metadata?.last_name || '',
          avatar_url: metadata?.avatar_url || ''
        });

      if (insertError) {
        console.error('Error creating profile:', insertError);
        return false;
      } else {
        console.log("Profile created successfully");
        return true;
      }
    } else {
      console.log("Profile already exists for user:", userId);
      return true;
    }
  } catch (error) {
    console.error('Exception in ensureProfileExists:', error);
    return false;
  }
};

// New function to update profile with better error handling and database consistency
export const updateUserProfile = async (userId: string, profileData: any): Promise<boolean> => {
  try {
    if (!userId) {
      console.error("Cannot update profile without user ID");
      return false;
    }
    
    console.log("Updating profile for user:", userId, "with data:", profileData);
    
    // Filter out undefined/null values to prevent overwriting with nulls
    const cleanProfileData = Object.entries(profileData).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
    
    // Handle avatar_url separately to ensure it's always a clean URL without cache busting params
    if (profileData.avatar_url) {
      try {
        const url = new URL(profileData.avatar_url);
        // Remove cache busting query params if present
        url.search = '';
        cleanProfileData.avatar_url = url.toString();
      } catch (e) {
        // If not a valid URL, use as is
        cleanProfileData.avatar_url = profileData.avatar_url;
      }
    }
    
    console.log("Cleaned profile data for update:", cleanProfileData);
    
    const { error } = await supabase
      .from('profiles')
      .update(cleanProfileData)
      .eq('id', userId);
    
    if (error) {
      console.error('Error updating profile:', error);
      return false;
    }
    
    console.log("Profile updated successfully");
    return true;
  } catch (error) {
    console.error('Exception in updateUserProfile:', error);
    return false;
  }
};

// New function to fetch full profile data with error handling
export const fetchUserProfile = async (userId: string): Promise<any> => {
  try {
    if (!userId) {
      console.error("Cannot fetch profile without user ID");
      return null;
    }
    
    console.log("Fetching profile for user:", userId);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    
    console.log("Profile fetched successfully:", data);
    return data;
  } catch (error) {
    console.error('Exception in fetchUserProfile:', error);
    return null;
  }
};
