import { supabase } from '@/integrations/supabase/client';

export const getDeviceType = (): string => {
  const ua = navigator.userAgent;
  let device = "Desktop";
  
  if (/mobile/i.test(ua)) {
    device = "Mobile";
  } else if (/tablet/i.test(ua)) {
    device = "Tablet";
  }
  
  return device;
};

export const getIPAndLocation = async (): Promise<{ ip: string; location: string }> => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    const city = data.city || 'Unknown';
    const country = data.country_name || 'Unknown';
    const location = `${city}, ${country}`;
    const ip = data.ip || 'N/A';
    
    return { ip, location };
  } catch (error) {
    console.error('Error fetching IP and location:', error);
    return { ip: 'N/A', location: 'Unknown' };
  }
};

export const saveLoginActivity = async (userId: string) => {
  try {
    const device = getDeviceType();
    const { ip, location } = await getIPAndLocation();

    const { error } = await supabase.functions.invoke('log-activity', {
      body: {
        userId,
        action: 'login',
        ip,
        location,
        userAgent: navigator.userAgent,
        metadata: { device, location },
      },
    });

    if (error) {
      console.error('Error saving login activity via edge function:', error);
    }
  } catch (error) {
    console.error('Error saving login activity:', error);
  }
};
