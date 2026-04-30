import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Pencil, Check, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import * as api from '../../services/api';

const PRESET_COLORS = [
  '#5a4a9c', '#7c3aed', '#2563eb', '#3a7b93',
  '#4d9768', '#b88514', '#c2553f', '#e11d48',
  '#d946ef', '#f97316', '#06b6d4', '#84cc16',
];

function TagPill({ name, color, size = 'md' }) {
  const sizeClasses = {
    sm: 'text-[9px] px-[5px] py-[1px]',
    md: 'text-[11px] px-[8px] py-[3px]',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full ${sizeClasses[size]}`}
      style={{ backgroundColor: color + '18', color }}
    >
      <span className="w-[6px] h-[6px] rounded-full mr-[4px]" style={{ backgroundColor: color }} />
      {name}
    </span>
  );
}

export { TagPill };

export default function TagManager() {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: api.getTags,
  });

  const createMut = useMutation({
    mutationFn: api.createTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setNewName('');
      toast.success('Tag criada');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Erro ao criar tag'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => api.updateTag(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setEditingId(null);
      toast.success('Tag atualizada');
    },
  });

  const deleteMut = useMutation({
    mutationFn: api.deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag excluida');
    },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createMut.mutate({ name: newName.trim(), color: newColor });
  };

  const startEdit = (tag) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
  };

  const saveEdit = () => {
    if (!editName.trim()) return;
    updateMut.mutate({ id: editingId, data: { name: editName.trim(), color: editColor } });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[13px] font-semibold text-ink-800 mb-3">Tags do sistema</h3>

        {/* Create form */}
        <form onSubmit={handleCreate} className="flex items-center gap-2 mb-4">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Nome da tag..."
            className="flex-1 border border-ink-200 rounded-md px-3 py-[7px] text-[13px] outline-none focus:border-violet-500 transition"
          />
          <div className="flex gap-[3px]">
            {PRESET_COLORS.slice(0, 6).map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setNewColor(c)}
                className={`w-5 h-5 rounded-full transition-all ${newColor === c ? 'ring-2 ring-offset-1 ring-violet-400 scale-110' : 'hover:scale-110'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button
            type="submit"
            disabled={!newName.trim() || createMut.isPending}
            className="flex items-center gap-1 px-3 py-[7px] text-[12px] font-medium text-white bg-violet-500 rounded-md hover:bg-violet-600 disabled:opacity-50 transition-all shadow-violet"
          >
            <Plus size={13} /> Criar
          </button>
        </form>

        {/* Tags list */}
        {isLoading && <p className="text-ink-400 text-[13px]">Carregando...</p>}
        <div className="space-y-[6px]">
          {tags.map(tag => (
            <div key={tag.id} className="flex items-center gap-2 px-3 py-[8px] bg-ink-50 rounded-lg group">
              {editingId === tag.id ? (
                <>
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="flex-1 border border-ink-200 rounded-sm px-2 py-1 text-[12px] outline-none focus:border-violet-500"
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && saveEdit()}
                  />
                  <div className="flex gap-[2px]">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditColor(c)}
                        className={`w-4 h-4 rounded-full transition-all ${editColor === c ? 'ring-2 ring-offset-1 ring-violet-400' : ''}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <button onClick={saveEdit} className="p-1 text-success-500 hover:bg-success-50 rounded">
                    <Check size={14} />
                  </button>
                  <button onClick={() => setEditingId(null)} className="p-1 text-ink-400 hover:bg-ink-100 rounded">
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <TagPill name={tag.name} color={tag.color} />
                  <span className="flex-1" />
                  <button onClick={() => startEdit(tag)} className="p-1 text-ink-400 hover:text-violet-500 hover:bg-violet-50 rounded opacity-0 group-hover:opacity-100 transition-all">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => deleteMut.mutate(tag.id)} className="p-1 text-ink-400 hover:text-danger-500 hover:bg-danger-50 rounded opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={13} />
                  </button>
                </>
              )}
            </div>
          ))}
          {!isLoading && tags.length === 0 && (
            <p className="text-[12px] text-ink-400 py-2">Nenhuma tag criada ainda. Crie a primeira acima.</p>
          )}
        </div>
      </div>
    </div>
  );
}
