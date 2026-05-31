import jwt from 'jsonwebtoken';
import { parseCookies } from 'nookies';

export function verifyAuth(handler) {
  return async (req, res) => {
    try {
      const cookies = parseCookies({ req });
      const token = cookies.token;
      
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}

export function requireRole(...roles) {
  return (handler) => {
    return async (req, res) => {
      if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Access denied' });
      }
      return handler(req, res);
    };
  };
}