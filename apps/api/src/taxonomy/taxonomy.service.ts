import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface CodedItemDto {
  code: string;
  name: string;
}

export interface QualificationDto extends CodedItemDto {
  rank: number;
}

export interface SubjectGroupDto extends CodedItemDto {
  subjects: CodedItemDto[];
}

export interface TaxonomyBundleDto {
  subjectGroups: SubjectGroupDto[];
  levels: CodedItemDto[];
  curricula: CodedItemDto[];
  qualifications: QualificationDto[];
  jobTypes: CodedItemDto[];
  roleTypes: CodedItemDto[];
  states: CodedItemDto[];
}

export interface LgaListDto {
  state: CodedItemDto;
  lgas: { id: number; name: string }[];
}

const active = { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } as const;

@Injectable()
export class TaxonomyService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getBundle(): Promise<TaxonomyBundleDto> {
    const [groups, levels, curricula, qualifications, jobTypes, roleTypes, states] =
      await Promise.all([
        this.prisma.subjectGroup.findMany({
          orderBy: { sortOrder: 'asc' },
          include: { subjects: active },
        }),
        this.prisma.level.findMany(active),
        this.prisma.curriculum.findMany(active),
        this.prisma.qualification.findMany({
          where: { isActive: true },
          orderBy: [{ rank: 'asc' }, { sortOrder: 'asc' }],
        }),
        this.prisma.jobType.findMany(active),
        this.prisma.roleType.findMany(active),
        this.prisma.state.findMany({ orderBy: { name: 'asc' } }),
      ]);

    const pick = (item: { code: string; name: string }): CodedItemDto => ({
      code: item.code,
      name: item.name,
    });

    return {
      subjectGroups: groups.map((group) => ({
        ...pick(group),
        subjects: group.subjects.map(pick),
      })),
      levels: levels.map(pick),
      curricula: curricula.map(pick),
      qualifications: qualifications.map((item) => ({ ...pick(item), rank: item.rank })),
      jobTypes: jobTypes.map(pick),
      roleTypes: roleTypes.map(pick),
      states: states.map(pick),
    };
  }

  async getLgas(stateCode: string): Promise<LgaListDto> {
    const state = await this.prisma.state.findUnique({ where: { code: stateCode } });
    if (!state) {
      throw new NotFoundException('State not found');
    }
    const lgas = await this.prisma.lga.findMany({
      where: { stateId: state.id },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
    return { state: { code: state.code, name: state.name }, lgas };
  }
}
