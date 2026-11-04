import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { lgasByState } from '../src/taxonomy/lga.data.js';
import {
  curricula,
  jobTypes,
  levels,
  qualifications,
  roleTypes,
  states,
  subjectGroups,
  subjects,
} from '../src/taxonomy/taxonomy.data.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Check apps/api/.env');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main(): Promise<void> {
  for (const [index, item] of subjectGroups.entries()) {
    await prisma.subjectGroup.upsert({
      where: { code: item.code },
      update: { name: item.name, sortOrder: index },
      create: { code: item.code, name: item.name, sortOrder: index },
    });
  }

  const groups = await prisma.subjectGroup.findMany();
  const groupIdByCode = new Map(groups.map((group) => [group.code, group.id]));

  for (const [index, item] of subjects.entries()) {
    const groupId = groupIdByCode.get(item.groupCode);
    if (groupId === undefined) {
      throw new Error(`Subject ${item.code} has unknown group ${item.groupCode}`);
    }
    await prisma.subject.upsert({
      where: { code: item.code },
      update: { name: item.name, groupId, sortOrder: index },
      create: { code: item.code, name: item.name, groupId, sortOrder: index },
    });
  }

  for (const [index, item] of levels.entries()) {
    await prisma.level.upsert({
      where: { code: item.code },
      update: { name: item.name, sortOrder: index },
      create: { code: item.code, name: item.name, sortOrder: index },
    });
  }

  for (const [index, item] of curricula.entries()) {
    await prisma.curriculum.upsert({
      where: { code: item.code },
      update: { name: item.name, sortOrder: index },
      create: { code: item.code, name: item.name, sortOrder: index },
    });
  }

  for (const [index, item] of qualifications.entries()) {
    await prisma.qualification.upsert({
      where: { code: item.code },
      update: { name: item.name, rank: item.rank, sortOrder: index },
      create: { code: item.code, name: item.name, rank: item.rank, sortOrder: index },
    });
  }

  for (const [index, item] of jobTypes.entries()) {
    await prisma.jobType.upsert({
      where: { code: item.code },
      update: { name: item.name, sortOrder: index },
      create: { code: item.code, name: item.name, sortOrder: index },
    });
  }

  for (const [index, item] of roleTypes.entries()) {
    await prisma.roleType.upsert({
      where: { code: item.code },
      update: { name: item.name, sortOrder: index },
      create: { code: item.code, name: item.name, sortOrder: index },
    });
  }

  for (const item of states) {
    await prisma.state.upsert({
      where: { code: item.code },
      update: { name: item.name },
      create: { code: item.code, name: item.name },
    });
  }

  const stateRows = await prisma.state.findMany();
  const stateIdByCode = new Map(stateRows.map((state) => [state.code, state.id]));

  for (const [stateCode, names] of Object.entries(lgasByState)) {
    const stateId = stateIdByCode.get(stateCode);
    if (stateId === undefined) {
      throw new Error(`LGA data has unknown state code ${stateCode}`);
    }
    for (const name of names) {
      await prisma.lga.upsert({
        where: { stateId_name: { stateId, name } },
        update: {},
        create: { stateId, name },
      });
    }
  }

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
