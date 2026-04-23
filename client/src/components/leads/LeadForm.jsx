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
        <label className="block text-[13px] font-medium text-ink-700 mb-[5px]">Nome *</label>
        <input {...register('name', { required: 'Nome e obrigatorio' })} className="w-full border border-ink-200 rounded-sm bg-ink-0 px-3 py-[9px] text-[13px] text-ink-900 outline-none transition focus:border-violet-500 focus:shadow-[0_0_0_3px_rgba(90,74,156,0.18)]" />
        {errors.name && <p className="text-danger-500 text-xs mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <label className="block text-[13px] font-medium text-ink-700 mb-[5px]">Telefone *</label>
        <input {...register('phone', { required: 'Telefone e obrigatorio' })} placeholder="5511999999999" className="w-full border border-ink-200 rounded-sm bg-ink-0 px-3 py-[9px] text-[13px] text-ink-900 outline-none transition focus:border-violet-500 focus:shadow-[0_0_0_3px_rgba(90,74,156,0.18)]" />
        {errors.phone && <p className="text-danger-500 text-xs mt-1">{errors.phone.message}</p>}
      </div>
      <div>
        <label className="block text-[13px] font-medium text-ink-700 mb-[5px]">Email</label>
        <input {...register('email')} type="email" className="w-full border border-ink-200 rounded-sm bg-ink-0 px-3 py-[9px] text-[13px] text-ink-900 outline-none transition focus:border-violet-500 focus:shadow-[0_0_0_3px_rgba(90,74,156,0.18)]" />
      </div>
      <div>
        <label className="block text-[13px] font-medium text-ink-700 mb-[5px]">Empresa</label>
        <input {...register('company')} className="w-full border border-ink-200 rounded-sm bg-ink-0 px-3 py-[9px] text-[13px] text-ink-900 outline-none transition focus:border-violet-500 focus:shadow-[0_0_0_3px_rgba(90,74,156,0.18)]" />
      </div>
      <div>
        <label className="block text-[13px] font-medium text-ink-700 mb-[5px]">Tags (separadas por virgula)</label>
        <input {...register('tags')} placeholder="hot, interessado, vip" className="w-full border border-ink-200 rounded-sm bg-ink-0 px-3 py-[9px] text-[13px] text-ink-900 outline-none transition focus:border-violet-500 focus:shadow-[0_0_0_3px_rgba(90,74,156,0.18)]" />
      </div>
      <div>
        <label className="block text-[13px] font-medium text-ink-700 mb-[5px]">Notas</label>
        <textarea {...register('notes')} rows={3} className="w-full border border-ink-200 rounded-sm bg-ink-0 px-3 py-[9px] text-[13px] text-ink-900 outline-none resize-y transition focus:border-violet-500 focus:shadow-[0_0_0_3px_rgba(90,74,156,0.18)]" />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        {onCancel && <button type="button" onClick={onCancel} className="px-4 py-[9px] text-[13px] font-medium text-ink-700 bg-ink-0 border border-ink-200 rounded-md hover:bg-ink-75 transition-colors">Cancelar</button>}
        <button type="submit" className="px-4 py-[9px] text-[13px] font-medium text-white bg-violet-500 rounded-md hover:bg-violet-600 shadow-violet transition-all">{lead ? 'Salvar' : 'Criar lead'}</button>
      </div>
    </form>
  );
}
