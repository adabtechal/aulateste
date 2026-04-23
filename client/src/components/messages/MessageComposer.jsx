import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Image } from 'lucide-react';
import toast from 'react-hot-toast';
import * as api from '../../services/api';

export default function MessageComposer({ leadId }) {
  const [text, setText] = useState('');
  const [mediaMode, setMediaMode] = useState(false);
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

  const handleSend = () => {
    if (mediaMode && mediaUrl) {
      sendMediaMut.mutate({ leadId, mediaUrl, caption: text });
    } else if (text.trim()) {
      sendTextMut.mutate({ leadId, text });
    }
  };

  const isLoading = sendTextMut.isPending || sendMediaMut.isPending;

  return (
    <div className="border-t border-ink-150 p-3">
      {mediaMode && (
        <input value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder="URL da imagem..." className="w-full border border-ink-200 rounded-sm px-3 py-[9px] text-[13px] mb-2 outline-none focus:border-violet-500" />
      )}
      <div className="flex gap-2">
        <button onClick={() => setMediaMode(!mediaMode)} className={`p-2 rounded-lg transition-colors ${mediaMode ? 'bg-violet-50 text-violet-600' : 'text-ink-400 hover:bg-ink-75'}`}>
          <Image size={18} />
        </button>
        <input value={text} onChange={e => setText(e.target.value)} placeholder={mediaMode ? 'Legenda da imagem...' : 'Digite sua mensagem...'} className="flex-1 border border-ink-200 rounded-sm px-3 py-[9px] text-[13px] outline-none focus:border-violet-500 transition" onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()} disabled={isLoading} />
        <button onClick={handleSend} disabled={isLoading || (!text.trim() && !mediaUrl)} className="p-2 text-white bg-violet-500 rounded-md hover:bg-violet-600 disabled:opacity-50 transition-all shadow-violet">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
