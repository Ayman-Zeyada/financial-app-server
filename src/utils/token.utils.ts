import jwt, { SignOptions } from 'jsonwebtoken';
import { UserAttributes } from '../models/user.model';
import logger from './logger';

interface TokenPayload {
  userId: number;
  username: string;
  email: string;
}

export const generateAccessToken = (user: UserAttributes): string => {
  const payload: TokenPayload = {
    userId: user.id,
    username: user.username,
    email: user.email,
  };

  // Default to 1 day in seconds if not provided
  const expiresIn = process.env.JWT_EXPIRES_IN 
    ? parseInt(process.env.JWT_EXPIRES_IN) 
    : 86400; // 1 day in seconds

  return jwt.sign(
    payload, 
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn }
  );
};

export const generateRefreshToken = (user: UserAttributes): string => {
  const payload: TokenPayload = {
    userId: user.id,
    username: user.username,
    email: user.email,
  };

  // Default to 7 days in seconds if not provided
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN 
    ? parseInt(process.env.JWT_REFRESH_EXPIRES_IN) 
    : 604800; // 7 days in seconds

  return jwt.sign(
    payload, 
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn }
  );
};

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback_secret'
    ) as TokenPayload;
    return decoded;
  } catch (error) {
    logger.error(`Token verification failed: ${error}`);
    return null;
  }
};

export const generateResetToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

export const generateVerificationToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};