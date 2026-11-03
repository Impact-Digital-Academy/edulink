import { describe, expect, it } from 'vitest';
import {
  curricula,
  jobTypes,
  levels,
  qualifications,
  roleTypes,
  states,
  subjectGroups,
  subjects,
} from './taxonomy.data.js';

const lists: Record<string, readonly { code: string; name: string }[]> = {
  subjectGroups,
  subjects,
  levels,
  curricula,
  qualifications,
  jobTypes,
  roleTypes,
  states,
};

describe('taxonomy data', () => {
  for (const [listName, list] of Object.entries(lists)) {
    it(`${listName}: codes are unique snake_case and names are filled in`, () => {
      const codes = list.map((item) => item.code);
      expect(new Set(codes).size).toBe(codes.length);
      for (const item of list) {
        expect(item.code).toMatch(/^[a-z][a-z0-9_]*$/);
        expect(item.name.trim().length).toBeGreaterThan(0);
      }
    });
  }

  it('every subject belongs to a known group', () => {
    const groupCodes = new Set(subjectGroups.map((group) => group.code));
    for (const subject of subjects) {
      expect(groupCodes.has(subject.groupCode)).toBe(true);
    }
  });

  it('qualification ranks are positive and unique', () => {
    const ranks = qualifications.map((item) => item.rank);
    expect(new Set(ranks).size).toBe(ranks.length);
    for (const rank of ranks) {
      expect(rank).toBeGreaterThan(0);
    }
  });

  it('has 36 states plus the FCT', () => {
    expect(states).toHaveLength(37);
  });
});