const request = require('supertest');
const app = require('../app');
const { db } = require('../database/init');

// Run after all tests to cleanly close the database
afterAll(() => {
  db.close();
});

describe('Authentication API Endpoints', () => {
  const uniqueId = Math.floor(Math.random() * 10000);
  const testUser = {
    username: `testuser${uniqueId}`,
    email: `testuser${uniqueId}@example.com`,
    password: 'Password123!',
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('username', testUser.username);
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user).not.toHaveProperty('password_hash');
    });

    it('should fail to register a user with an existing email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: `another${uniqueId}`,
          email: testUser.email,
          password: 'Password123!',
        })
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Email is already registered');
    });

    it('should fail to register with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'invalidemailuser',
          email: 'not-an-email',
          password: 'Password123!',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login an existing user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('username', testUser.username);
    });

    it('should fail to login with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword!',
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should fail to login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nobody@example.com',
          password: 'Password123!',
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toBe('Invalid credentials');
    });
  });
});
