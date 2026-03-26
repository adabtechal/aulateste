import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export function useRealtimeLeads() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        queryClient.invalidateQueries({ queryKey: ['leads'] });
        queryClient.invalidateQueries({ queryKey: ['kanban'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kanban_stages' }, () => {
        queryClient.invalidateQueries({ queryKey: ['stages'] });
        queryClient.invalidateQueries({ queryKey: ['kanban'] });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_log' }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['messages'] });
        queryClient.invalidateQueries({ queryKey: ['lead-messages'] });
        if (payload.new?.direction === 'incoming') {
          toast('📩 Nova mensagem recebida!');
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);
}
