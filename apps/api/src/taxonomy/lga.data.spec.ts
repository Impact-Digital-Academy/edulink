import { describe, expect, it } from 'vitest';
import { lgasByState } from './lga.data.js';
import { states } from './taxonomy.data.js';

// Official number of local government areas per state (774 in total).
const officialCounts: Readonly<Record<string, number>> = {
  abia: 17,
  adamawa: 21,
  akwa_ibom: 31,
  anambra: 21,
  bauchi: 20,
  bayelsa: 8,
  benue: 23,
  borno: 27,
  cross_river: 18,
  delta: 25,
  ebonyi: 13,
  edo: 18,
  ekiti: 16,
  enugu: 17,
  fct: 6,
  gombe: 11,
  imo: 27,
  jigawa: 27,
  kaduna: 23,
  kano: 44,
  katsina: 34,
  kebbi: 21,
  kogi: 21,
  kwara: 16,
  lagos: 20,
  nasarawa: 13,
  niger: 25,
  ogun: 20,
  ondo: 18,
  osun: 30,
  oyo: 33,
  plateau: 17,
  rivers: 23,
  sokoto: 23,
  taraba: 16,
  yobe: 17,
  zamfara: 14,
};

describe('LGA data', () => {
  it('has exactly 774 local governments', () => {
    const total = Object.values(lgasByState).reduce((sum, list) => sum + list.length, 0);
    expect(total).toBe(774);
  });

  it('covers every state and no unknown state', () => {
    const stateCodes = states.map((state) => state.code).sort();
    expect(Object.keys(lgasByState).sort()).toEqual(stateCodes);
  });

  it.each(Object.entries(officialCounts))('%s has %i local governments', (code, count) => {
    expect(lgasByState[code]).toHaveLength(count);
  });

  it('has no blank, padded or duplicate names within a state', () => {
    for (const [code, names] of Object.entries(lgasByState)) {
      const lowered = names.map((name) => name.toLowerCase());
      expect(new Set(lowered).size, `duplicates in ${code}`).toBe(names.length);
      for (const name of names) {
        expect(name, `padding in ${code}`).toBe(name.trim());
        expect(name.length, `blank name in ${code}`).toBeGreaterThan(0);
      }
    }
  });
});
