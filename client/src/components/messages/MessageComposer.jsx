import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Image, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import * as api from '../../services/api';

export default function MessageComposer({ leadId }) {
  const [text, setText] = useState('');
  const [mediaMode, setMediaMode] = useState(false);
  const [noteMode, setNoteMode] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const queryClient = useQueryClient();

  const sendTextMut = useMutation({
    mutationFn: (data) => api.sendText(data),
    onSuccess: () => { setText(''); queryClient.invalidateQueries({ queryKey: ['lead-messages', leadId] }); toast.success('Mensagem enviada'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Erro ao enviar')
  });

  const sendMediaMut = useMutation({
    mutationFn: (data) => api.sendMedia(data),
    onSuccess: () => { setText(''); setMediaUrl(''); setMediaMode(false); queryClient.invalidateQueries({ queryKey: ['lead-messages', leadId] }); toast.success('Imagem enviada'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Erro ao enviar')
  });

  const sendNoteMut = useMutation({
    mutationFn: (data) => api.createInternalNote(data),
    onSuccess: () => { setText(''); setNoteMode(false); queryClient.invalidateQueries({ queryKey: ['lead-messages', leadId] }); toast.success('Nota interna criada'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Erro ao criar nota')
  });

  const handleSend = () => {
    if (noteMode && text.trim()) {
      sendNoteMut.mutate({ leadId, content: text });
    } else if (mediaMode && mediaUrl) {
      sendMediaMut.mutate({ leadId, mediaUrl, caption: text });
    } else if (text.trim()) {
      sendTextMut.mutate({ leadId, text });
    }
  };

  const toggleNote = () => {
    setNoteMode(!noteMode);
    if (mediaMode) setMediaMode(false);
  };

  const toggleMedia = () => {
    setMediaMode(!mediaMode);
    if (noteMode) setNoteMode(false);
  };

  const isLoading = sendTextMut.isPending || sendMediaMut.isPending || sendNoteMut.isPending;

  return (
    <div className={`border-t p-3 ${noteMode ? 'border-warning-100 bg-warning-50/40' : 'border-ink-150'}`}>
      {noteMode && (
        <div className="flex items-center gap-1 mb-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-warning-700">
          <FileText size={11} />
          Modo nota interna — nao sera enviado ao cliente
        </div>
      )}
      {mediaMode && (
        <input value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder="URL da imagem..." className="w-full border border-ink-200 rounded-sm px-3 py-[9px] text-[13px] mb-2 outline-none focus:border-violet-500" />
      )}
      <div className="flex gap-2">
        <button onClick={toggleMedia} className={`p-2 rounded-lg transition-colors ${mediaMode ? 'bg-violet-50 text-violet-600' : 'text-ink-400 hover:bg-ink-75'}`} title="Enviar imagem">
          <Image size={18} />
        </button>
        <button onClick={toggleNote} className={`p-2 rounded-lg transition-colors ${noteMode ? 'bg-warning-100 text-warning-700' : 'text-ink-400 hover:bg-ink-75'}`} title="Nota interna">
          <FileText size={18} />
        </button>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={noteMode ? 'Escreva uma nota interna...' : mediaMode ? 'Legenda da imagem...' : 'Digite sua mensagem...'}
          className={`flex-1 border rounded-sm px-3 py-[9px] text-[13px] outline-none transition ${noteMode ? 'border-warning-100 focus:border-warning-500 bg-warning-50/50' : 'border-ink-200 focus:border-violet-500'}`}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || (!text.trim() && !mediaUrl)}
          className={`p-2 text-white rounded-md disabled:opacity-50 transition-all ${noteMode ? 'bg-warning-500 hover:bg-warning-700' : 'bg-violet-500 hover:bg-violet-600 shadow-violet'}`}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
