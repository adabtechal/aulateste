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

/**
 * Subscription dedicada às mensagens de UM lead específico.
 * Filtra server-side por `lead_id=eq.{leadId}` para evitar invalidar
 * queries de outros leads. Use no LeadDetailPage para chat realtime.
 */
export function useRealtimeLeadMessages(leadId) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!leadId) return;

    const channel = supabase
      .channel(`lead-messages-${leadId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_log',
          filter: `lead_id=eq.${leadId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['lead-messages', leadId] });
          queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lead_stage_history',
          filter: `lead_id=eq.${leadId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId, queryClient]);
}
