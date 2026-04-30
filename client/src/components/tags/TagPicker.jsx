import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Plus, ChevronDown } from 'lucide-react';
import * as api from '../../services/api';

export default function TagPicker({ value = [], onChange }) {
  const [open, setOpen] = useState(false);
  const [customTag, setCustomTag] = useState('');

  const { data: availableTags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: api.getTags,
  });

  const tagMap = {};
  availableTags.forEach(t => { tagMap[t.name] = t.color; });

  const addTag = (tagName) => {
    const normalized = tagName.trim().toLowerCase();
    if (normalized && !value.includes(normalized)) {
      onChange([...value, normalized]);
    }
    setCustomTag('');
  };

  const removeTag = (tagName) => {
    onChange(value.filter(t => t !== tagName));
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (customTag.trim()) {
      addTag(customTag);
    }
  };

  const unselected = availableTags.filter(t => !value.includes(t.name));

  return (
    <div className="relative">
      {/* Selected tags */}
      <div
        className="flex flex-wrap gap-[5px] min-h-[38px] p-[6px] border border-ink-200 rounded-sm bg-ink-0 cursor-pointer transition focus-within:border-violet-500 focus-within:shadow-[0_0_0_3px_rgba(90,74,156,0.18)]"
        onClick={() => setOpen(!open)}
      >
        {value.map(tag => {
          const color = tagMap[tag] || '#5a4a9c';
          return (
            <span
              key={tag}
              className="inline-flex items-center gap-[3px] text-[11px] font-semibold px-[7px] py-[2px] rounded-full"
              style={{ backgroundColor: color + '18', color }}
            >
              <span className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: color }} />
              {tag}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                className="ml-[2px] hover:opacity-70 transition-opacity"
              >
                <X size={10} />
              </button>
            </span>
          );
        })}
        {value.length === 0 && <span className="text-[13px] text-ink-400 px-1 py-[2px]">Selecionar tags...</span>}
        <ChevronDown size={14} className={`ml-auto self-center text-ink-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-ink-0 border border-ink-200 rounded-lg shadow-lg py-1 max-h-[220px] overflow-y-auto">
          {/* Custom tag input */}
          <form onSubmit={handleCustomSubmit} className="flex items-center gap-1 px-2 py-1 border-b border-ink-100">
            <Plus size={12} className="text-ink-400 shrink-0" />
            <input
              value={customTag}
              onChange={e => setCustomTag(e.target.value)}
              placeholder="Criar tag personalizada..."
              className="flex-1 text-[12px] px-1 py-[4px] outline-none bg-transparent"
              autoFocus
              onClick={e => e.stopPropagation()}
            />
          </form>

          {/* Available tags */}
          {unselected.map(tag => (
            <button
              key={tag.id}
              type="button"
              onClick={(e) => { e.stopPropagation(); addTag(tag.name); }}
              className="w-full flex items-center gap-2 px-3 py-[6px] text-left hover:bg-ink-50 transition-colors"
            >
              <span className="w-[8px] h-[8px] rounded-full" style={{ backgroundColor: tag.color }} />
              <span className="text-[12px] text-ink-700">{tag.name}</span>
            </button>
          ))}

          {unselected.length === 0 && !customTag && (
            <p className="text-[11px] text-ink-400 px-3 py-2">Todas as tags ja foram selecionadas</p>
          )}
        </div>
      )}

      {/* Backdrop to close */}
      {open && <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />}
    </div>
  );
}
