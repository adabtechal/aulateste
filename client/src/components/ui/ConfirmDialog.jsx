import Modal from './Modal';

export default function ConfirmDialog({ open, onClose, onConfirm, title, message }) {
  return (
    <Modal open={open} onClose={onClose} title={title || 'Confirmar'} size="sm">
      <p className="text-ink-600 mb-4 text-base leading-relaxed">{message}</p>
      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onClose} className="px-4 py-[9px] text-[13px] font-medium text-ink-700 bg-ink-0 border border-ink-200 rounded-md hover:bg-ink-75 transition-colors duration-[120ms]">Cancelar</button>
        <button onClick={onConfirm} className="px-4 py-[9px] text-[13px] font-medium text-white bg-danger-500 rounded-md hover:bg-danger-700 transition-colors duration-[120ms]">Confirmar</button>
      </div>
    </Modal>
  );
}
