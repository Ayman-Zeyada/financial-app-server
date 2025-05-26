import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  generateResetToken,
  generateVerificationToken,
} from '../../../src/utils/token.utils';
import jwt from 'jsonwebtoken';

interface MockUserAttributes {
  id: number;
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isVerified: boolean;
}

describe('Token Utils', () => {
  const mockUser: MockUserAttributes = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    isVerified: true,
  };

  const originalJwtSecret = process.env.JWT_SECRET;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test_secret_key';
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalJwtSecret;
  });

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken(mockUser);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should include correct payload in token', () => {
      const token = generateAccessToken(mockUser);
      const decoded = jwt.verify(token, 'test_secret_key') as any;

      expect(decoded.userId).toBe(mockUser.id);
      expect(decoded.username).toBe(mockUser.username);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.exp).toBeDefined();
    });

    it('should use default expiration if JWT_EXPIRES_IN is not set', () => {
      const originalExpiresIn = process.env.JWT_EXPIRES_IN;
      delete process.env.JWT_EXPIRES_IN;

      const token = generateAccessToken(mockUser);
      const decoded = jwt.verify(token, 'test_secret_key') as any;

      const expectedExp = Math.floor(Date.now() / 1000) + 86400;
      expect(decoded.exp).toBeCloseTo(expectedExp, -2);

      process.env.JWT_EXPIRES_IN = originalExpiresIn;
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(mockUser);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should have longer expiration than access token', () => {
      process.env.JWT_EXPIRES_IN = '3600';
      process.env.JWT_REFRESH_EXPIRES_IN = '7200';

      const accessToken = generateAccessToken(mockUser);
      const refreshToken = generateRefreshToken(mockUser);

      const accessDecoded = jwt.verify(accessToken, 'test_secret_key') as any;
      const refreshDecoded = jwt.verify(refreshToken, 'test_secret_key') as any;

      expect(refreshDecoded.exp).toBeGreaterThan(accessDecoded.exp);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = generateAccessToken(mockUser);
      const result = verifyToken(token);

      expect(result).toBeDefined();
      expect(result?.userId).toBe(mockUser.id);
      expect(result?.username).toBe(mockUser.username);
      expect(result?.email).toBe(mockUser.email);
    });

    it('should return null for invalid token', () => {
      const result = verifyToken('invalid_token');
      expect(result).toBeNull();
    });

    it('should return null for expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: mockUser.id, username: mockUser.username, email: mockUser.email },
        'test_secret_key',
        { expiresIn: '0s' },
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = verifyToken(expiredToken);
      expect(result).toBeNull();
    });

    it('should return null for token with wrong secret', () => {
      const tokenWithWrongSecret = jwt.sign(
        { userId: mockUser.id, username: mockUser.username, email: mockUser.email },
        'wrong_secret',
        { expiresIn: '1h' },
      );

      const result = verifyToken(tokenWithWrongSecret);
      expect(result).toBeNull();
    });
  });

  describe('generateResetToken', () => {
    it('should generate a reset token', () => {
      const token = generateResetToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate unique tokens', () => {
      const token1 = generateResetToken();
      const token2 = generateResetToken();

      expect(token1).not.toBe(token2);
    });

    it('should generate tokens with expected format', () => {
      const token = generateResetToken();

      expect(token).toMatch(/^[a-z0-9]+$/);
      expect(token.length).toBeGreaterThan(20);
    });
  });

  describe('generateVerificationToken', () => {
    it('should generate a verification token', () => {
      const token = generateVerificationToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate unique tokens', () => {
      const token1 = generateVerificationToken();
      const token2 = generateVerificationToken();

      expect(token1).not.toBe(token2);
    });

    it('should generate tokens with expected format', () => {
      const token = generateVerificationToken();

      expect(token).toMatch(/^[a-z0-9]+$/);
      expect(token.length).toBeGreaterThan(20);
    });
  });
});
