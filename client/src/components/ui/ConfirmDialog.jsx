import Modal from './Modal';

export default function ConfirmDialog({ open, onClose, onConfirm, title, message }) {
  return (
    <Modal open={open} onClose={onClose} title={title || 'Confirmar'} size="sm">
      <p className="text-gray-600 mb-4">{message}</p>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
        <button onClick={onConfirm} className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700">Confirmar</button>
      </div>
    </Modal>
  );
}
