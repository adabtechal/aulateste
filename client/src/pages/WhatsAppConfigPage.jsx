import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import * as api from '../services/api';

export default function WhatsAppConfigPage() {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState('');
  const [activeInstance, setActiveInstance] = useState(null);

  const { data: instances = [] } = useQuery({ queryKey: ['whatsapp-instances'], queryFn: api.getInstances });

  const createMut = useMutation({
    mutationFn: (name) => api.createInstance(name),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-instances'] });
      setNewName('');
      setActiveInstance(data.instance?.instance_name);
      toast.success('Instância criada');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Erro ao criar instância')
  });

  const deleteMut = useMutation({
    mutationFn: api.deleteInstance,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['whatsapp-instances'] }); toast.success('Instância removida'); }
  });

  return (
    <div className="p-6 max-w-4xl">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Configuração WhatsApp</h2>

      {/* Create instance */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold mb-3">Nova Instância</h3>
        <div className="flex gap-2">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome da instância (ex: leadtrack-main)" className="flex-1 border rounded-lg px-3 py-2 text-sm" onKeyDown={e => e.key === 'Enter' && newName && createMut.mutate(newName)} />
          <button onClick={() => newName && createMut.mutate(newName)} disabled={!newName || createMut.isPending} className="flex items-center gap-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            <Plus size={16} /> Criar
          </button>
        </div>
      </div>

      {/* Instances list */}
      <div className="space-y-4">
        {instances.map(inst => (
          <InstanceCard key={inst.id} instance={inst} isActive={activeInstance === inst.instance_name} onActivate={() => setActiveInstance(activeInstance === inst.instance_name ? null : inst.instance_name)} onDelete={() => deleteMut.mutate(inst.instance_name)} />
        ))}
        {instances.length === 0 && (
          <div className="bg-white border rounded-lg p-8 text-center text-gray-400">
            Nenhuma instância WhatsApp configurada
          </div>
        )}
      </div>
    </div>
  );
}

function InstanceCard({ instance, isActive, onActivate, onDelete }) {
  const { data: status } = useQuery({
    queryKey: ['whatsapp-status', instance.instance_name],
    queryFn: () => api.getConnectionStatus(instance.instance_name),
    refetchInterval: isActive ? 10000 : 30000,
    retry: false
  });

  const { data: qrData, refetch: refetchQR } = useQuery({
    queryKey: ['whatsapp-qr', instance.instance_name],
    queryFn: () => api.getQRCode(instance.instance_name),
    enabled: isActive && status?.state !== 'open',
    refetchInterval: isActive && status?.state !== 'open' ? 30000 : false,
    retry: false
  });

  const connected = status?.state === 'open';

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {connected ? <Wifi size={20} className="text-green-600" /> : <WifiOff size={20} className="text-gray-400" />}
          <div>
            <h4 className="text-sm font-semibold">{instance.instance_name}</h4>
            <p className={`text-xs ${connected ? 'text-green-600' : 'text-gray-500'}`}>
              {connected ? 'Conectado' : 'Desconectado'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!connected && (
            <button onClick={onActivate} className="px-3 py-1.5 text-xs text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">
              {isActive ? 'Fechar QR' : 'Conectar'}
            </button>
          )}
          {connected && (
            <button onClick={() => refetchQR()} className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
              <RefreshCw size={12} /> Reconectar
            </button>
          )}
          <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {isActive && !connected && qrData?.code && (
        <div className="mt-4 flex flex-col items-center border-t pt-4">
          <p className="text-sm text-gray-600 mb-3">Escaneie o QR Code com o WhatsApp</p>
          <QRCodeSVG value={qrData.code} size={256} />
          {qrData.pairingCode && (
            <p className="mt-2 text-sm text-gray-500">Código: <strong>{qrData.pairingCode}</strong></p>
          )}
          <p className="text-xs text-gray-400 mt-2">QR atualiza automaticamente a cada 30s</p>
        </div>
      )}
    </div>
  );
}
