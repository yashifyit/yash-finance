import { applyGoalChange as a, goalPercent as p } from '../goals';
// @ts-ignore -- bun's built-in test runner has no type declarations in this project
import { expect, test } from 'bun:test';
test('reaching target completes', () => expect(a(900,1000,100)).toEqual({current_amount:1000,is_completed:true}));
test('withdraw below target un-completes', () => expect(a(1000,1000,-1)).toEqual({current_amount:999,is_completed:false}));
test('never negative', () => expect(a(50,1000,-80).current_amount).toBe(0));
test('percent', () => expect(p(250,1000)).toBe(25));
