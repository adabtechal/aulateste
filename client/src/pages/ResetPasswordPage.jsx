import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('As senhas nao coincidem');
      return;
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
      toast.success('Senha atualizada com sucesso');
      navigate('/kanban');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink-75 flex items-center justify-center p-4" style={{ background: 'radial-gradient(120% 90% at 15% 0%, rgba(122,106,180,0.18) 0%, rgba(122,106,180,0) 55%), linear-gradient(180deg, #fbfaf6 0%, #f0ede8 100%)' }}>
      <div className="w-full max-w-md bg-ink-0 rounded-xl border border-ink-150 shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-violet-50 rounded-xl mb-3">
            <Lock className="text-violet-600" size={22} />
          </div>
          <h2 className="text-xl font-semibold text-ink-900">Nova senha</h2>
          <p className="text-[13px] text-ink-500 mt-1">Digite sua nova senha abaixo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-ink-700 mb-[5px]">Nova senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-[9px] border border-ink-200 rounded-sm text-[13px] outline-none transition focus:border-violet-500 focus:shadow-[0_0_0_3px_rgba(90,74,156,0.18)]"
              placeholder="Minimo 6 caracteres"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-ink-700 mb-[5px]">Confirmar senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-[9px] border border-ink-200 rounded-sm text-[13px] outline-none transition focus:border-violet-500 focus:shadow-[0_0_0_3px_rgba(90,74,156,0.18)]"
              placeholder="Repita a senha"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-500 hover:bg-violet-600 text-white font-medium py-[10px] rounded-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-violet"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle size={18} /> Atualizar senha</>}
          </button>
        </form>
      </div>
    </div>
  );
}
