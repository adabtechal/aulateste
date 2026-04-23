import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/api';

export default function WhatsAppConfigPage() {
  const queryClient = useQueryClient();
  const { profile, isSuperAdmin } = useAuth();
  const [newName, setNewName] = useState('');
  const [activeInstance, setActiveInstance] = useState(null);
  const [selectedTenantId, setSelectedTenantId] = useState('');

  const { data: tenants = [] } = useQuery({
    queryKey: ['user-tenants'],
    queryFn: api.getUserTenants,
    enabled: isSuperAdmin,
  });

  const activeTenantId = useMemo(() => {
    if (isSuperAdmin) return selectedTenantId;
    return profile?.tenant_id || profile?.tenant?.id || '';
  }, [isSuperAdmin, selectedTenantId, profile]);

  useEffect(() => {
    if (isSuperAdmin && !selectedTenantId && tenants.length > 0) {
      setSelectedTenantId(tenants[0].id);
    }
  }, [isSuperAdmin, selectedTenantId, tenants]);

  const { data: instances = [] } = useQuery({
    queryKey: ['whatsapp-instances', activeTenantId],
    queryFn: () => api.getInstances(activeTenantId),
    enabled: Boolean(activeTenantId),
  });

  const createMut = useMutation({
    mutationFn: (name) => api.createInstance(name, activeTenantId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-instances', activeTenantId] });
      setNewName('');
      setActiveInstance(data.instance?.instance_name);
      toast.success('Instancia criada');
    },
    onError: (err) => {
      const body = err.response?.data;
      const msg = body?.message || 'Erro ao criar instancia';
      const detail = body?.details || body?.hint || body?.code;
      toast.error(detail ? `${msg} — ${detail}` : msg);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (name) => api.deleteInstance(name, activeTenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-instances', activeTenantId] });
      toast.success('Instancia removida');
    },
  });

  const canCreate = Boolean(newName) && Boolean(activeTenantId) && !createMut.isPending;

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-500">Config</p>
        <h2 className="text-[22px] font-semibold text-ink-900 tracking-tight">Configuracao <em className="font-serif font-normal text-violet-600">WhatsApp</em></h2>
      </div>

      {isSuperAdmin && (
        <div className="bg-ink-0 border border-ink-150 rounded-lg p-5 mb-6">
          <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-500 block mb-[5px]">Tenant alvo</label>
          <select
            value={selectedTenantId}
            onChange={(e) => setSelectedTenantId(e.target.value)}
            className="w-full border border-ink-200 rounded-sm px-3 py-[9px] text-[13px] bg-ink-0 outline-none focus:border-violet-500"
          >
            <option value="">Selecione uma tenant</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>{t.name} ({t.slug})</option>
            ))}
          </select>
        </div>
      )}

      <div className="bg-ink-0 border border-ink-150 rounded-lg p-5 mb-6">
        <h3 className="text-[13px] font-semibold text-ink-900 mb-3">Nova instancia</h3>
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome da instancia (ex: leadtrack-main)"
            className="flex-1 border border-ink-200 rounded-sm px-3 py-[9px] text-[13px] bg-ink-0 outline-none focus:border-violet-500"
            onKeyDown={(e) => e.key === 'Enter' && canCreate && createMut.mutate(newName)}
          />
          <button
            onClick={() => canCreate && createMut.mutate(newName)}
            disabled={!canCreate}
            className="flex items-center gap-[7px] px-[14px] py-2 text-[13px] font-medium text-white bg-violet-500 rounded-md hover:bg-violet-600 disabled:opacity-50 transition-all shadow-violet"
          >
            <Plus size={14} /> Criar
          </button>
        </div>
        {!activeTenantId && (
          <p className="mt-2 text-xs text-warning-500">
            {isSuperAdmin ? 'Selecione uma tenant acima para criar instancias.' : 'Seu perfil nao esta vinculado a uma tenant.'}
          </p>
        )}
      </div>

      <div className="space-y-4">
        {instances.map((inst) => (
          <InstanceCard
            key={inst.id}
            instance={inst}
            tenantId={activeTenantId}
            isActive={activeInstance === inst.instance_name}
            onActivate={() => setActiveInstance(activeInstance === inst.instance_name ? null : inst.instance_name)}
            onDelete={() => deleteMut.mutate(inst.instance_name)}
          />
        ))}
        {instances.length === 0 && activeTenantId && (
          <div className="bg-ink-0 border border-ink-150 rounded-lg p-12 text-center text-ink-400 text-[13px]">
            Nenhuma instancia WhatsApp configurada
          </div>
        )}
      </div>
    </div>
  );
}

function InstanceCard({ instance, tenantId, isActive, onActivate, onDelete }) {
  const { data: status } = useQuery({
    queryKey: ['whatsapp-status', instance.instance_name, tenantId],
    queryFn: () => api.getConnectionStatus(instance.instance_name, tenantId),
    refetchInterval: isActive ? 10000 : 30000,
    retry: false,
  });

  const { data: qrData, refetch: refetchQR } = useQuery({
    queryKey: ['whatsapp-qr', instance.instance_name],
    queryFn: () => api.getQRCode(instance.instance_name),
    enabled: isActive && status?.state !== 'open',
    refetchInterval: isActive && status?.state !== 'open' ? 30000 : false,
    retry: false,
  });

  const connected = status?.state === 'open';

  return (
    <div className="bg-ink-0 border border-ink-150 rounded-lg p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {connected ? <Wifi size={18} className="text-success-500" /> : <WifiOff size={18} className="text-ink-400" />}
          <div>
            <h4 className="text-[13px] font-semibold text-ink-900">{instance.instance_name}</h4>
            <p className={`text-[11px] ${connected ? 'text-success-500' : 'text-ink-500'}`}>
              {connected ? 'Conectado' : 'Desconectado'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!connected && (
            <button onClick={onActivate} className="px-3 py-[6px] text-xs font-medium text-violet-600 bg-violet-50 rounded-md hover:bg-violet-100 transition-colors">
              {isActive ? 'Fechar QR' : 'Conectar'}
            </button>
          )}
          {connected && (
            <button onClick={() => refetchQR()} className="flex items-center gap-1 px-3 py-[6px] text-xs font-medium text-ink-600 bg-ink-75 rounded-md hover:bg-ink-100 transition-colors">
              <RefreshCw size={12} /> Reconectar
            </button>
          )}
          <button onClick={onDelete} className="p-[6px] text-ink-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {isActive && !connected && qrData?.code && (
        <div className="mt-4 flex flex-col items-center border-t border-ink-100 pt-4">
          <p className="text-[13px] text-ink-600 mb-3">Escaneie o QR Code com o WhatsApp</p>
          <QRCodeSVG value={qrData.code} size={256} />
          {qrData.pairingCode && (
            <p className="mt-2 text-[13px] text-ink-500">Codigo: <strong className="font-mono">{qrData.pairingCode}</strong></p>
          )}
          {qrData.recreated && (
            <p className="text-xs text-warning-500 mt-2">Instancia recriada automaticamente — webhook reconfigurado</p>
          )}
          <p className="text-xs text-ink-400 mt-2">QR atualiza automaticamente a cada 30s</p>
        </div>
      )}

      {isActive && !connected && !qrData?.code && qrData?.connected && (
        <div className="mt-4 flex flex-col items-center border-t border-ink-100 pt-4">
          <p className="text-[13px] text-success-500">Instancia ja conectada — atualize a pagina</p>
        </div>
      )}
    </div>
  );
}
