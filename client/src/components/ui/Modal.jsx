import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null;

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-ink-950/48 backdrop-blur-[4px]" onClick={onClose} />
      <div className={`relative bg-ink-0 rounded-xl shadow-xl w-full ${sizes[size]} mx-4 max-h-[90vh] overflow-y-auto animate-[scaleIn_200ms_ease]`}>
        <div className="flex items-center justify-between px-6 pt-6 pb-0">
          <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-ink-75 rounded-lg transition-colors duration-[120ms]"><X size={18} strokeWidth={1.75} /></button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
