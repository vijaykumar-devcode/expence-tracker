const jwt = require('jsonwebtoken');
const { findById } = require('../repositories/userRepository');
const { validateUuid } = require('../utils/validation');

const getTokenFromRequest = (req) => {
  const cookieHeader = req.headers.cookie || '';
  const authCookie = cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('expense_token='));

  if (authCookie) {
    return decodeURIComponent(authCookie.substring('expense_token='.length));
  }

  const authorization = req.headers.authorization || '';
  return authorization.startsWith('Bearer ') ? authorization.substring(7) : null;
};

const protect = async (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!validateUuid(decoded.userId)) {
      return res.status(401).json({ message: 'Invalid authentication token' });
    }
    const user = await findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      message: error.name === 'TokenExpiredError' ? 'Session expired' : 'Invalid authentication token',
    });
  }
};

module.exports = { protect };
