function errorHandler(err, req, res, next) {
  // Log detalhado no server: message + code + details + hint (Supabase/Postgres)
  const supabaseCode = err.code || err.details || err.hint;
  console.error(
    `[Error] ${req.method} ${req.path}:`,
    err.message,
    supabaseCode ? { code: err.code, details: err.details, hint: err.hint } : ''
  );

  const isDev = process.env.NODE_ENV === 'development';
  const statusCode = err.statusCode || 500;
  const message = err.statusCode
    ? err.message
    : isDev
      ? err.message || 'Internal server error'
      : 'Internal server error';

  res.status(statusCode).json({
    error: true,
    message,
    ...(isDev && {
      stack: err.stack,
      // Expõe campos de erro do Supabase/Postgres em dev para facilitar diagnóstico
      ...(err.code && { code: err.code }),
      ...(err.details && { details: err.details }),
      ...(err.hint && { hint: err.hint }),
    }),
  });
}

module.exports = { errorHandler };
