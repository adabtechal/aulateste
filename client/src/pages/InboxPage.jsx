import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, MessageSquare, ArrowRight, Clock, User, Calendar, ChevronRight, Phone, Mail, Building, ExternalLink, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import MessageBubble from '../components/messages/MessageBubble';
import MessageComposer from '../components/messages/MessageComposer';
import { TagPill } from '../components/tags/TagManager';
import { useRealtimeLeads, useRealtimeLeadMessages } from '../hooks/useRealtime';
import * as api from '../services/api';

function ConversationItem({ conversation, isActive, onClick, tagColors }) {
  const lastMsg = conversation.last_message;
  const hasUnread = conversation.unread_count > 0;

  const initials = conversation.name
    ? conversation.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const hash = conversation.name?.split('').reduce((a, c) => a + c.charCodeAt(0), 0) || 0;
  const avatarColors = ['bg-violet-500', 'bg-coral-500', 'bg-success-500', 'bg-info-500', 'bg-warning-500', 'bg-danger-500'];
  const avatarColor = avatarColors[hash % avatarColors.length];

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-all duration-100 border-b border-ink-100 ${
        isActive
          ? 'bg-violet-50 border-l-[3px] border-l-violet-500'
          : 'hover:bg-ink-50 border-l-[3px] border-l-transparent'
      }`}
    >
      <div className="relative shrink-0">
        <div className={`w-10 h-10 rounded-full ${avatarColor} text-white flex items-center justify-center text-[13px] font-semibold`}>
          {initials}
        </div>
        {hasUnread && (
          <span className="absolute -top-[2px] -right-[2px] w-[18px] h-[18px] bg-danger-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
            {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-[13px] truncate ${hasUnread ? 'font-bold text-ink-900' : 'font-semibold text-ink-800'}`}>
            {conversation.name}
          </span>
          <span className="text-[10px] text-ink-400 shrink-0 font-mono">
            {lastMsg ? formatDistanceToNow(new Date(lastMsg.sent_at), { addSuffix: false, locale: ptBR }) : ''}
          </span>
        </div>

        {lastMsg && (
          <p className={`text-[12px] truncate mt-[2px] ${hasUnread ? 'text-ink-700 font-medium' : 'text-ink-500'}`}>
            {lastMsg.direction === 'outgoing' && <span className="text-ink-400">Voce: </span>}
            {lastMsg.direction === 'auto' && <span className="text-success-500">Auto: </span>}
            {lastMsg.content || (lastMsg.message_type === 'image' ? '📷 Imagem' : '...')}
          </p>
        )}

        {!lastMsg && (
          <p className="text-[12px] text-ink-400 italic mt-[2px]">Sem mensagens</p>
        )}

        <div className="flex items-center gap-1 mt-[4px]">
          {conversation.kanban_stages && (
            <span
              className="text-[9px] font-semibold uppercase tracking-[0.04em] px-[6px] py-[1px] rounded-full"
              style={{ backgroundColor: conversation.kanban_stages.color + '18', color: conversation.kanban_stages.color }}
            >
              {conversation.kanban_stages.name}
            </span>
          )}
          {conversation.tags?.slice(0, 2).map(t => {
            const tagDef = tagColors[t];
            return (
              <span
                key={t}
                className="text-[9px] font-medium px-[5px] py-[1px] rounded-full"
                style={tagDef
                  ? { backgroundColor: tagDef + '18', color: tagDef }
                  : { backgroundColor: '#e8e5f0', color: '#5a4a9c' }
                }
              >
                {t}
              </span>
            );
          })}
        </div>
      </div>
    </button>
  );
}

function ChatPanel({ leadId, leadName, leadPhone, leadStage, onBack, onToggleInfo, showInfo }) {
  const scrollRef = useRef(null);

  useRealtimeLeadMessages(leadId);

  const { data: messages = [] } = useQuery({
    queryKey: ['lead-messages', leadId],
    queryFn: () => api.getLeadMessages(leadId),
    refetchInterval: 5000,
    enabled: !!leadId,
  });

  const { data: lead } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: () => api.getLead(leadId),
    enabled: !!leadId,
  });

  const timeline = [
    ...messages.map(m => ({ ...m, type: 'message', timestamp: m.sent_at })),
    ...(lead?.stage_history || []).map(h => ({ ...h, type: 'stage_change', timestamp: h.moved_at }))
  ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [timeline.length]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-ink-150 bg-ink-0/90 backdrop-blur-[8px]">
        <button onClick={onBack} className="lg:hidden p-1 hover:bg-ink-75 rounded-lg">
          <ArrowRight size={16} className="rotate-180" />
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-semibold text-ink-900 tracking-tight">{leadName}</h3>
          <p className="text-[11px] text-ink-500 font-mono">{leadPhone}</p>
        </div>
        {leadStage && (
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.04em] px-[9px] py-[3px] rounded-full"
            style={{ backgroundColor: leadStage.color + '18', color: leadStage.color }}
          >
            {leadStage.name}
          </span>
        )}
        <button
          onClick={onToggleInfo}
          className={`p-[6px] rounded-lg transition-colors ${showInfo ? 'bg-violet-50 text-violet-600' : 'text-ink-400 hover:bg-ink-75'}`}
          title="Informacoes do lead"
        >
          {showInfo ? <PanelRightClose size={17} /> : <PanelRightOpen size={17} />}
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
        {timeline.map((item, i) => {
          if (item.type === 'message') {
            return <MessageBubble key={`msg-${item.id}`} message={item} />;
          }
          return (
            <div key={`stage-${item.id || i}`} className="flex justify-center my-2">
              <span className="flex items-center gap-1 text-[10px] text-ink-500 bg-ink-100 px-3 py-1 rounded-full font-mono">
                <ArrowRight size={10} />
                {item.from_stage?.name || 'Inicio'} → {item.to_stage?.name || '?'}
                <Clock size={9} className="ml-1" />
                {format(new Date(item.timestamp), 'dd/MM HH:mm')}
              </span>
            </div>
          );
        })}
        {timeline.length === 0 && (
          <p className="text-center text-ink-400 py-8 text-[13px]">Nenhuma interacao ainda</p>
        )}
      </div>

      <MessageComposer leadId={leadId} />
    </div>
  );
}

function LeadInfoPanel({ leadId, tagColors }) {
  const navigate = useNavigate();

  const { data: lead } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: () => api.getLead(leadId),
    enabled: !!leadId,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['lead-bookings', lead?.phone],
    queryFn: () => api.getBookingsByPhone(lead.phone),
    enabled: !!lead?.phone,
  });

  if (!lead) return null;

  const statusColors = {
    confirmed: { bg: 'bg-success-50', text: 'text-success-700', label: 'Confirmado' },
    cancelled: { bg: 'bg-danger-50', text: 'text-danger-500', label: 'Cancelado' },
    completed: { bg: 'bg-info-50', text: 'text-info-500', label: 'Concluido' },
    pending: { bg: 'bg-warning-50', text: 'text-warning-700', label: 'Pendente' },
  };

  return (
    <div className="w-[280px] shrink-0 border-l border-ink-150 bg-ink-0 overflow-y-auto">
      {/* Lead info header */}
      <div className="p-4 border-b border-ink-100">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">Dados do lead</h4>
          <button
            onClick={() => navigate(`/leads/${leadId}`)}
            className="flex items-center gap-1 text-[10px] font-medium text-violet-500 hover:text-violet-700 transition-colors"
          >
            Abrir <ExternalLink size={10} />
          </button>
        </div>

        <div className="space-y-[10px]">
          <div className="flex items-center gap-2">
            <Phone size={12} className="text-ink-400 shrink-0" />
            <span className="text-[12px] font-mono text-ink-700">{lead.phone}</span>
          </div>
          {lead.email && (
            <div className="flex items-center gap-2">
              <Mail size={12} className="text-ink-400 shrink-0" />
              <span className="text-[12px] text-ink-700 truncate">{lead.email}</span>
            </div>
          )}
          {lead.company && (
            <div className="flex items-center gap-2">
              <Building size={12} className="text-ink-400 shrink-0" />
              <span className="text-[12px] text-ink-700">{lead.company}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="p-4 border-b border-ink-100">
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500 mb-2">Tags</h4>
        <div className="flex flex-wrap gap-1">
          {lead.tags?.length > 0
            ? lead.tags.map(t => <TagPill key={t} name={t} color={tagColors[t] || '#5a4a9c'} size="sm" />)
            : <span className="text-[11px] text-ink-400 italic">Sem tags</span>
          }
        </div>
      </div>

      {/* Notes */}
      {lead.notes && (
        <div className="p-4 border-b border-ink-100">
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500 mb-2">Notas</h4>
          <p className="text-[12px] text-ink-600 whitespace-pre-wrap">{lead.notes}</p>
        </div>
      )}

      {/* Agendamentos */}
      <div className="p-4">
        <div className="flex items-center gap-1 mb-3">
          <Calendar size={13} className="text-ink-400" />
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">Agendamentos</h4>
          {bookings.length > 0 && (
            <span className="text-[10px] font-bold bg-violet-100 text-violet-600 px-[5px] py-[1px] rounded-full ml-auto">
              {bookings.length}
            </span>
          )}
        </div>

        {bookings.length === 0 ? (
          <p className="text-[11px] text-ink-400 italic">Nenhum agendamento</p>
        ) : (
          <div className="space-y-2">
            {bookings.slice(0, 5).map(b => {
              const st = statusColors[b.status] || statusColors.pending;
              return (
                <div key={b.id} className="bg-ink-50 rounded-md p-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-ink-800">
                      {format(new Date(b.booking_date + 'T12:00:00'), 'dd/MM')} {b.booking_time?.substring(0, 5)}
                    </span>
                    <span className={`text-[9px] font-semibold uppercase px-[5px] py-[1px] rounded-full ${st.bg} ${st.text}`}>
                      {st.label}
                    </span>
                  </div>
                  {b.service_interest && (
                    <p className="text-[10px] text-ink-500 mt-[2px] truncate">{b.service_interest}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Criado em */}
      <div className="px-4 pb-4">
        <p className="text-[10px] text-ink-400 font-mono">
          Criado em {format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm')}
        </p>
      </div>
    </div>
  );
}

export default function InboxPage() {
  const [activeId, setActiveId] = useState(null);
  const [search, setSearch] = useState('');
  const [showInfo, setShowInfo] = useState(false);

  useRealtimeLeads();

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['inbox', { search }],
    queryFn: () => api.getInbox({ search: search || undefined }),
    refetchInterval: 8000,
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: api.getTags,
  });

  const tagColors = {};
  tags.forEach(t => { tagColors[t.name] = t.color; });

  const activeConversation = conversations.find(c => c.id === activeId);
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Conversation list */}
      <div className={`w-[340px] shrink-0 border-r border-ink-150 bg-ink-0 flex flex-col ${activeId ? 'hidden lg:flex' : 'flex'}`}>
        <div className="px-4 pt-5 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-500">Conversas</p>
              <h2 className="text-[20px] font-semibold text-ink-900 tracking-tight">
                <em className="font-serif font-normal text-violet-600">Inbox</em>
                {totalUnread > 0 && (
                  <span className="ml-2 text-[11px] font-bold bg-danger-500 text-white px-[7px] py-[2px] rounded-full align-middle">
                    {totalUnread}
                  </span>
                )}
              </h2>
            </div>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-[10px] text-ink-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar conversa..."
              className="w-full pl-9 pr-3 py-[8px] border border-ink-200 rounded-md text-[13px] bg-ink-0 outline-none transition focus:border-violet-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading && <div className="p-8 text-center text-ink-400 text-[13px]">Carregando...</div>}
          {!isLoading && conversations.length === 0 && (
            <div className="p-8 text-center text-ink-400">
              <MessageSquare size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-[13px]">Nenhuma conversa encontrada</p>
            </div>
          )}
          {conversations.map(conv => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeId}
              onClick={() => { setActiveId(conv.id); setShowInfo(false); }}
              tagColors={tagColors}
            />
          ))}
        </div>
      </div>

      {/* Chat panel */}
      <div className={`flex-1 flex flex-col bg-ink-75 min-w-0 ${!activeId ? 'hidden lg:flex' : 'flex'}`}>
        {activeId && activeConversation ? (
          <ChatPanel
            leadId={activeId}
            leadName={activeConversation.name}
            leadPhone={activeConversation.phone}
            leadStage={activeConversation.kanban_stages}
            onBack={() => setActiveId(null)}
            onToggleInfo={() => setShowInfo(!showInfo)}
            showInfo={showInfo}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={28} className="text-violet-400" />
              </div>
              <h3 className="text-[15px] font-semibold text-ink-700 mb-1">Selecione uma conversa</h3>
              <p className="text-[13px] text-ink-400">Escolha um lead para ver as mensagens</p>
            </div>
          </div>
        )}
      </div>

      {/* Lead info panel */}
      {showInfo && activeId && (
        <LeadInfoPanel leadId={activeId} tagColors={tagColors} />
      )}
    </div>
  );
}
