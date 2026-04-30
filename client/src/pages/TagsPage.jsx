import TagManager from '../components/tags/TagManager';

export default function TagsPage() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-500">Config</p>
        <h2 className="text-[22px] font-semibold text-ink-900 tracking-tight">
          Gerenciar <em className="font-serif font-normal text-violet-600">tags</em>
        </h2>
        <p className="text-[13px] text-ink-500 mt-1">Crie e edite tags com cores para organizar seus leads visualmente.</p>
      </div>
      <div className="bg-ink-0 border border-ink-150 rounded-lg p-5">
        <TagManager />
      </div>
    </div>
  );
}
