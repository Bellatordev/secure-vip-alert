import { supabase } from '@/integrations/supabase/client';

export async function queryResearch(query: string, context?: string): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('research-query', {
      body: { query, context },
    });

    if (error) {
      console.error('Research query error:', error);
      return 'Unable to complete research at this time.';
    }

    return data.research || 'No research results available.';
  } catch (error) {
    console.error('Research error:', error);
    return 'Research service unavailable.';
  }
}
