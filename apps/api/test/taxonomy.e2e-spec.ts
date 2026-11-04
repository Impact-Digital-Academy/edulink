import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { type LgaListDto, type TaxonomyBundleDto } from '../src/taxonomy/taxonomy.service.js';

describe('Taxonomy (e2e, needs the seeded database)', () => {
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

  it('GET /v1/taxonomy returns every reference list in one request', async () => {
    const res = await request(app.getHttpServer()).get('/v1/taxonomy').expect(200);
    const body = res.body as TaxonomyBundleDto;

    expect(body.subjectGroups).toHaveLength(8);
    const subjectCount = body.subjectGroups.reduce((sum, group) => sum + group.subjects.length, 0);
    expect(subjectCount).toBe(46);
    expect(body.levels.map((level) => level.code)).toEqual([
      'early_years',
      'lower_primary',
      'upper_primary',
      'junior_secondary',
      'senior_secondary',
    ]);
    expect(body.curricula).toHaveLength(6);
    expect(body.jobTypes).toHaveLength(5);
    expect(body.roleTypes).toHaveLength(10);
    expect(body.states).toHaveLength(37);
  });

  it('lists qualifications from lowest to highest rank', async () => {
    const res = await request(app.getHttpServer()).get('/v1/taxonomy').expect(200);
    const ranks = (res.body as TaxonomyBundleDto).qualifications.map((item) => item.rank);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    expect(ranks).toHaveLength(9);
  });

  it('exposes only code and name, never internal ids', async () => {
    const res = await request(app.getHttpServer()).get('/v1/taxonomy').expect(200);
    const firstLevel = (res.body as TaxonomyBundleDto).levels[0];
    expect(Object.keys(firstLevel ?? {}).sort()).toEqual(['code', 'name']);
  });

  it('allows the reference lists to be cached', async () => {
    const res = await request(app.getHttpServer()).get('/v1/taxonomy').expect(200);
    expect(res.headers['cache-control']).toContain('max-age=3600');
  });

  it('GET /v1/taxonomy/states/ogun/lgas returns Ogun local governments', async () => {
    const res = await request(app.getHttpServer()).get('/v1/taxonomy/states/ogun/lgas').expect(200);
    const body = res.body as LgaListDto;
    expect(body.state.name).toBe('Ogun');
    expect(body.lgas).toHaveLength(20);
    expect(body.lgas.map((lga) => lga.name)).toContain('Ado-Odo/Ota');
  });

  it('returns the right counts for Lagos and the FCT', async () => {
    const lagos = await request(app.getHttpServer()).get('/v1/taxonomy/states/lagos/lgas').expect(200);
    const fct = await request(app.getHttpServer()).get('/v1/taxonomy/states/fct/lgas').expect(200);
    expect((lagos.body as LgaListDto).lgas).toHaveLength(20);
    expect((fct.body as LgaListDto).lgas).toHaveLength(6);
  });

  it('returns 404 for an unknown state', async () => {
    await request(app.getHttpServer()).get('/v1/taxonomy/states/narnia/lgas').expect(404);
  });

  it('treats hostile input as an unknown state, not an error', async () => {
    const hostile = encodeURIComponent("ogun'; DROP TABLE lgas;--");
    await request(app.getHttpServer()).get(`/v1/taxonomy/states/${hostile}/lgas`).expect(404);
  });
});
