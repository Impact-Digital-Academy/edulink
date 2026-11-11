import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /v1/health returns ok', async () => {
    const res = await request(app.getHttpServer()).get('/v1/health').expect(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /v1/health/ready confirms the database answers', async () => {
    const res = await request(app.getHttpServer()).get('/v1/health/ready').expect(200);
    expect(res.body.database).toBe('up');
  });

  it('sends security headers', async () => {
    const res = await request(app.getHttpServer()).get('/v1/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('does not serve the old root route', async () => {
    await request(app.getHttpServer()).get('/').expect(404);
  });
});
