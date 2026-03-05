import type { Request, Response, NextFunction } from 'express';

// Middleware to ensure user is authenticated via session
export const ensureAuthenticated = (req: Request, res: Response, next: NextFunction): void => {
  if (req.session.userId) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized - Please log in" });
};
