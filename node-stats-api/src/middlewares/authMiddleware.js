const jwt = require('jsonwebtoken');
const ApiError = require('../errors/ApiError');

// createAuthMiddleware exige un JWT valido (firmado con secret) en el
// header Authorization ("Bearer <token>"). Restringe explicitamente el
// algoritmo a HS256 para evitar ataques de confusion de algoritmo.
function createAuthMiddleware(secret) {
  return function authMiddleware(req, res, next) {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      return next(new ApiError(401, 'falta el token de autorización (header "Authorization: Bearer <token>")'));
    }

    const token = header.slice('Bearer '.length);
    try {
      jwt.verify(token, secret, { algorithms: ['HS256'] });
      next();
    } catch (err) {
      next(new ApiError(401, 'token inválido o expirado'));
    }
  };
}

module.exports = createAuthMiddleware;
