export function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'not_found',
    message: `No route for ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: 'server_error',
    message: err.message || 'Unexpected server error',
  });
}
