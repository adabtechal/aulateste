const supabase = require('../lib/supabase');

async function requireAuth(req, res, next) {
  try {
    const authorization = req.headers.authorization || '';

    if (!authorization.startsWith('Bearer ')) {
      return res.status(401).json({ error: true, message: 'Token de autenticação ausente' });
    }

    const token = authorization.slice(7);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ error: true, message: 'Sessão inválida ou expirada' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*, tenant:tenants(*)')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({ error: true, message: 'Perfil de usuário não encontrado' });
    }

    req.auth = { token, user, profile };
    next();
  } catch (error) {
    next(error);
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.auth?.profile || !allowedRoles.includes(req.auth.profile.role)) {
      return res.status(403).json({ error: true, message: 'Acesso negado para este perfil' });
    }

    next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
};
