import request from 'supertest';
import app from '../../src/app';
import { User } from '../../src/models';
import bcrypt from 'bcrypt';

describe('Auth API Integration Tests', () => {
  describe('POST /api/auth/register', () => {
    const validUserData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    };

    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('message');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('username', validUserData.username);
      expect(response.body.data).toHaveProperty('email', validUserData.email);
      expect(response.body.data).not.toHaveProperty('password');

      const user = await User.findOne({ where: { email: validUserData.email } });
      expect(user).toBeDefined();
      expect(user?.username).toBe(validUserData.username);
      expect(user?.isVerified).toBe(false);
    });

    it('should return 409 for duplicate email', async () => {
      await request(app).post('/api/auth/register').send(validUserData).expect(201);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUserData,
          username: 'differentuser',
        })
        .expect(409);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body.message).toContain('User already exists');
    });

    it('should return 409 for duplicate username', async () => {
      await request(app).post('/api/auth/register').send(validUserData).expect(201);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUserData,
          email: 'different@example.com',
        })
        .expect(409);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body.message).toContain('User already exists');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
        })
        .expect(400);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('errors');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUserData,
          email: 'invalid-email',
        })
        .expect(400);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body.errors).toHaveProperty('email');
    });

    it('should validate password length', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUserData,
          password: '123',
        })
        .expect(400);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body.errors).toHaveProperty('password');
    });
  });

  describe('POST /api/auth/login', () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    };

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      await User.create({
        ...userData,
        password: hashedPassword,
        isVerified: true,
      });
    });

    it('should login with valid credentials (username)', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: userData.username,
          password: userData.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should login with valid credentials (email)', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body.data.user.email).toBe(userData.email);
    });

    it('should return 401 for invalid username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: userData.password,
        })
        .expect(401);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: userData.username,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: userData.username,
        })
        .expect(400);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('GET /api/auth/me', () => {
    let accessToken: string;
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    };

    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(userData);

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      await User.update(
        { password: hashedPassword, isVerified: true },
        { where: { email: userData.email } },
      );

      const loginResponse = await request(app).post('/api/auth/login').send({
        username: userData.username,
        password: userData.password,
      });

      accessToken = loginResponse.body.data.tokens.accessToken;
    });

    it('should return current user data with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body.data).toHaveProperty('username', userData.username);
      expect(response.body.data).toHaveProperty('email', userData.email);
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should return 401 without token', async () => {
      const response = await request(app).get('/api/auth/me').set('Authorization', '').expect(401);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body.message).toContain('Not authenticated');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body.message).toContain('Invalid or expired token');
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    let refreshToken: string;
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    };

    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(userData);

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      await User.update(
        { password: hashedPassword, isVerified: true },
        { where: { email: userData.email } },
      );

      const loginResponse = await request(app).post('/api/auth/login').send({
        username: userData.username,
        password: userData.password,
      });

      refreshToken = loginResponse.body.data.tokens.refreshToken;
    });

    it('should refresh tokens with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
      expect(response.body.data.tokens.accessToken).not.toBe(refreshToken);
    });

    it('should return 400 without refresh token', async () => {
      const response = await request(app).post('/api/auth/refresh-token').send({}).expect(400);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body.message).toContain('Refresh token is required');
    });

    it('should return 401 with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalid_token' })
        .expect(401);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body.message).toContain('Invalid or expired refresh token');
    });
  });
});
