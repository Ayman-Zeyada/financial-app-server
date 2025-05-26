import request from 'supertest';
import app from '../../src/app';
import { User } from '../../src/models';
import { generateVerificationToken, generateResetToken } from '../../src/utils/token.utils';
import bcrypt from 'bcrypt';

describe('Authentication Flow E2E Tests', () => {
  const testUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
  };

  describe('Complete Registration Flow', () => {
    it('should complete full registration and verification flow', async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(registerResponse.body.status).toBe('success');
      expect(registerResponse.body.data.username).toBe(testUser.username);

      const userInDb = await User.findOne({ where: { email: testUser.email } });
      expect(userInDb).toBeDefined();
      expect(userInDb?.isVerified).toBe(false);
      expect(userInDb?.verificationToken).toBeDefined();

      const preVerificationLogin = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password,
        })
        .expect(200);

      expect(preVerificationLogin.body.data.user.isVerified).toBe(false);

      const verificationToken = userInDb?.verificationToken;
      const verifyResponse = await request(app)
        .get(`/api/auth/verify-email/${verificationToken}`)
        .expect(200);

      expect(verifyResponse.body.status).toBe('success');
      expect(verifyResponse.body.message).toContain('verified successfully');

      const verifiedUser = await User.findOne({ where: { email: testUser.email } });
      expect(verifiedUser?.isVerified).toBe(true);
      expect(verifiedUser?.verificationToken).toBeNull();

      const postVerificationLogin = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password,
        })
        .expect(200);

      expect(postVerificationLogin.body.data.user.isVerified).toBe(true);
      expect(postVerificationLogin.body.data.tokens.accessToken).toBeDefined();
      expect(postVerificationLogin.body.data.tokens.refreshToken).toBeDefined();
    });

    it('should reject invalid verification token', async () => {
      await request(app).post('/api/auth/register').send(testUser).expect(201);

      const response = await request(app).get('/api/auth/verify-email/invalid_token').expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Invalid verification token');
    });
  });

  describe('Password Reset Flow', () => {
    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      await User.create({
        ...testUser,
        password: hashedPassword,
        isVerified: true,
      });
    });

    it('should complete full password reset flow', async () => {
      const resetRequestResponse = await request(app)
        .post('/api/auth/request-password-reset')
        .send({ email: testUser.email })
        .expect(200);

      expect(resetRequestResponse.body.status).toBe('success');
      expect(resetRequestResponse.body.message).toContain('reset link');

      const userWithResetToken = await User.findOne({ where: { email: testUser.email } });
      expect(userWithResetToken?.resetPasswordToken).toBeDefined();
      expect(userWithResetToken?.resetPasswordExpires).toBeDefined();

      const resetToken = userWithResetToken?.resetPasswordToken;
      const newPassword = 'newpassword123';

      const resetPasswordResponse = await request(app)
        .post(`/api/auth/reset-password/${resetToken}`)
        .send({ password: newPassword })
        .expect(200);

      expect(resetPasswordResponse.body.status).toBe('success');
      expect(resetPasswordResponse.body.message).toContain('Password reset successful');

      const userAfterReset = await User.findOne({ where: { email: testUser.email } });
      expect(userAfterReset?.resetPasswordToken).toBeNull();
      expect(userAfterReset?.resetPasswordExpires).toBeNull();

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: newPassword,
        })
        .expect(200);

      expect(loginResponse.body.status).toBe('success');
      expect(loginResponse.body.data.tokens.accessToken).toBeDefined();

      await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password,
        })
        .expect(401);
    });

    it('should handle password reset for non-existent email gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/request-password-reset')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toContain('reset link');
    });

    it('should reject expired reset token', async () => {
      const expiredDate = new Date(Date.now() - 3600000);
      await User.update(
        {
          resetPasswordToken: generateResetToken(),
          resetPasswordExpires: expiredDate,
        },
        { where: { email: testUser.email } },
      );

      const user = await User.findOne({ where: { email: testUser.email } });
      const expiredToken = user?.resetPasswordToken;

      const response = await request(app)
        .post(`/api/auth/reset-password/${expiredToken}`)
        .send({ password: 'newpassword123' })
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Invalid or expired reset token');
    });
  });

  describe('Token Refresh Flow', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      await User.create({
        ...testUser,
        password: hashedPassword,
        isVerified: true,
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password,
        })
        .expect(200);

      accessToken = loginResponse.body.data.tokens.accessToken;
      refreshToken = loginResponse.body.data.tokens.refreshToken;
    });

    it('should refresh tokens successfully', async () => {
      const protectedRouteResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(protectedRouteResponse.body.data.username).toBe(testUser.username);

      const refreshResponse = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken })
        .expect(200);

      expect(refreshResponse.body.status).toBe('success');
      expect(refreshResponse.body.data.tokens.accessToken).toBeDefined();
      expect(refreshResponse.body.data.tokens.refreshToken).toBeDefined();
      expect(refreshResponse.body.data.tokens.accessToken).not.toBe(accessToken);
      expect(refreshResponse.body.data.tokens.refreshToken).not.toBe(refreshToken);

      const newAccessToken = refreshResponse.body.data.tokens.accessToken;
      const newProtectedRouteResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);

      expect(newProtectedRouteResponse.body.data.username).toBe(testUser.username);
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalid_refresh_token' })
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Invalid or expired refresh token');
    });
  });

  describe('Protected Route Access Flow', () => {
    let accessToken: string;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      await User.create({
        ...testUser,
        password: hashedPassword,
        isVerified: true,
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password,
        })
        .expect(200);

      accessToken = loginResponse.body.data.tokens.accessToken;
    });

    it('should access protected routes with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.username).toBe(testUser.username);
    });

    it('should reject access without token', async () => {
      const response = await request(app).get('/api/auth/me').expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Not authenticated');
    });

    it('should reject access with malformed token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer')
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Not authenticated');
    });

    it('should reject access with invalid token format', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat token_here')
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Not authenticated');
    });
  });
});
