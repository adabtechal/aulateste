import { useForm } from 'react-hook-form';

export default function LeadForm({ lead, onSubmit, onCancel }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: lead || { name: '', phone: '', email: '', company: '', tags: [], notes: '' }
  });

  const processSubmit = (data) => {
    const tags = typeof data.tags === 'string' ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : data.tags;
    onSubmit({ ...data, tags });
  };

  return (
    <form onSubmit={handleSubmit(processSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
        <input {...register('name', { required: 'Nome é obrigatório' })} className="w-full border rounded-lg px-3 py-2 text-sm" />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
        <input {...register('phone', { required: 'Telefone é obrigatório' })} placeholder="5511999999999" className="w-full border rounded-lg px-3 py-2 text-sm" />
        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input {...register('email')} type="email" className="w-full border rounded-lg px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
        <input {...register('company')} className="w-full border rounded-lg px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tags (separadas por vírgula)</label>
        <input {...register('tags')} placeholder="hot, interessado, vip" className="w-full border rounded-lg px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
        <textarea {...register('notes')} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>}
        <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">{lead ? 'Salvar' : 'Criar Lead'}</button>
      </div>
    </form>
  );
}
