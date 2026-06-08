import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useCompanyEmail = () => {
  const [email, setEmail] = useState('whitestonesmarkets@gmail.com');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const { data } = await supabase
          .from('website_settings')
          .select('value')
          .eq('key', 'company_email')
          .maybeSingle();
        if (data?.value) {
          setEmail(data.value);
        }
      } catch (err) {
        console.error('Error fetching company email:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmail();
  }, []);

  return { email, loading };
};
