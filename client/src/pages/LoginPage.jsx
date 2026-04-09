import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
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
        toast.success('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
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
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-4">
            <LogIn className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white">LeadTrack Pro</h1>
          <p className="text-blue-200 mt-2">Pipeline de Vendas & WhatsApp</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {showReset ? 'Recuperar Senha' : 'Entrar na Plataforma'}
          </h2>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            {!showReset && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="Sua senha"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : showReset ? (
                'Enviar E-mail de Recuperação'
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setShowReset(!showReset);
                setError('');
              }}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              {showReset ? 'Voltar ao login' : 'Esqueceu sua senha?'}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              Acesso somente por convite. Entre em contato com seu administrador.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
