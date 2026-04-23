import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { signIn, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showReset, setShowReset] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (showReset) {
        await resetPassword(email);
        toast.success('E-mail de recuperacao enviado');
        setShowReset(false);
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      const msg = err.message === 'Invalid login credentials'
        ? 'E-mail ou senha incorretos'
        : err.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink-75 flex items-center justify-center p-4" style={{ background: 'radial-gradient(120% 90% at 15% 0%, rgba(122,106,180,0.18) 0%, rgba(122,106,180,0) 55%), radial-gradient(80% 60% at 100% 100%, rgba(193,125,36,0.12) 0%, rgba(193,125,36,0) 60%), linear-gradient(180deg, #fbfaf6 0%, #f0ede8 100%)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-violet-500 to-violet-700 rounded-xl mb-4 shadow-violet">
            <span className="text-white text-xl font-extrabold tracking-tighter">L</span>
          </div>
          <h1 className="text-3xl font-bold text-ink-900 tracking-tight">leadtrack<span className="text-violet-500">.</span></h1>
          <p className="text-ink-500 mt-2 text-base">Pipeline de vendas & WhatsApp</p>
        </div>

        <div className="bg-ink-0 rounded-xl border border-ink-150 shadow-lg p-8">
          <h2 className="text-xl font-semibold text-ink-900 mb-6">
            {showReset ? 'Recuperar senha' : 'Entrar na plataforma'}
          </h2>

          {error && (
            <div className="flex items-center gap-2 bg-danger-50 border border-danger-100 text-danger-700 px-4 py-3 rounded-lg mb-4">
              <AlertCircle size={16} />
              <span className="text-[13px]">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-ink-700 mb-[5px]">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-[9px] border border-ink-200 rounded-sm text-[13px] text-ink-900 bg-ink-0 outline-none transition focus:border-violet-500 focus:shadow-[0_0_0_3px_rgba(90,74,156,0.18)]"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            {!showReset && (
              <div>
                <label className="block text-[13px] font-medium text-ink-700 mb-[5px]">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" size={16} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-[9px] border border-ink-200 rounded-sm text-[13px] text-ink-900 bg-ink-0 outline-none transition focus:border-violet-500 focus:shadow-[0_0_0_3px_rgba(90,74,156,0.18)]"
                    placeholder="Sua senha"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-500 hover:bg-violet-600 text-white font-medium py-[10px] rounded-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-violet"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : showReset ? (
                'Enviar e-mail de recuperacao'
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => { setShowReset(!showReset); setError(''); }}
              className="text-[13px] text-violet-600 hover:text-violet-700 transition-colors"
            >
              {showReset ? 'Voltar ao login' : 'Esqueceu sua senha?'}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-ink-100">
            <p className="text-xs text-ink-400 text-center">
              Acesso somente por convite. Entre em contato com seu administrador.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
