import { describe, expect, it } from 'vitest';
import { evaluate, fmtNum, trailingMath } from './math';

const vars = { flour: 1142, water: 822, biga: 1352, balls: 4, hydration: 72 };

describe('evaluate', () => {
  it('does arithmetic with the usual precedence and brackets', () => {
    expect(evaluate('2 + 3 * 4')).toBe(14);
    expect(evaluate('(2 + 3) * 4')).toBe(20);
    expect(evaluate('10 / 4 - 1')).toBe(1.5);
    expect(evaluate('2 ^ 3 ^ 2')).toBe(512);
    expect(evaluate('-3 + 5')).toBe(2);
    expect(evaluate('.5 * 4')).toBe(2);
  });

  it('reads the signs the keypad and phones type', () => {
    expect(evaluate('280×4')).toBe(1120);
    expect(evaluate('4 x 280')).toBe(1120);
    expect(evaluate('4x280')).toBe(1120);
    expect(evaluate('9÷3−1')).toBe(2);
  });

  it('takes percentages like a phone calculator', () => {
    expect(evaluate('1000 * 2.5%')).toBeCloseTo(25, 9);
    expect(evaluate('500 + 10%')).toBeCloseTo(550, 9);
    expect(evaluate('500 - 10%')).toBeCloseTo(450, 9);
    expect(evaluate('10%')).toBeCloseTo(0.1, 9);
  });

  it('knows the recipe amounts by name, in any case', () => {
    expect(evaluate('flour * 2%', vars)).toBeCloseTo(22.84, 9);
    expect(evaluate('Flour × hydration%', vars)).toBeCloseTo(822.24, 9);
    expect(evaluate('biga / balls', vars)).toBe(338);
    expect(evaluate('rye * 2', vars)).toBeNull();
  });

  it('ignores grams and reads thousands', () => {
    expect(evaluate('280g * 4')).toBe(1120);
    expect(evaluate('280 g * 4')).toBe(1120);
    expect(evaluate('1,000 / 4')).toBe(250);
  });

  it('gives nothing for half a sum or nonsense', () => {
    expect(evaluate('')).toBeNull();
    expect(evaluate('2 +')).toBeNull();
    expect(evaluate('(2 + 3')).toBeNull();
    expect(evaluate('2 3')).toBeNull();
    expect(evaluate('1 / 0')).toBeNull();
    expect(evaluate('1,5 * 2')).toBeNull();
  });
});

describe('sums at the end of a line of notes', () => {
  const answer = (line: string) => trailingMath(line, vars)?.value ?? null;

  it('works out the sum before a trailing "="', () => {
    expect(answer('4 x 280 =')).toBe(1120);
    expect(answer('4 x 280 = ')).toBe(1120);
    expect(answer('4*280=')).toBe(1120);
  });

  it('finds where the sum starts in a sentence', () => {
    expect(trailingMath('Divide into 4 x 280 =', vars)).toEqual({ expr: '4 x 280', value: 1120 });
    expect(answer('Salt: flour × 2.5% =')).toBeCloseTo(28.55, 9);
    expect(answer('Mix the water =')).toBe(822);
  });

  it('only looks back to the last "="', () => {
    expect(answer('biga flour = flour * 75% =')).toBeCloseTo(856.5, 9);
  });

  it('leaves a line alone when the answer is already there, or there is nothing to work out', () => {
    expect(answer('4 x 280 = 1120')).toBeNull();
    expect(answer('Step 2 =')).toBeNull();
    expect(answer('a == b')).toBeNull();
    expect(answer('x >=')).toBeNull();
    expect(answer('Just words =')).toBeNull();
    expect(answer('no equals sign')).toBeNull();
  });

  it("doesn't start a sum in the middle of a number or a time", () => {
    expect(answer('1,5 * 2 =')).toBeNull();
    expect(answer('18:00 + 2 =')).toBeNull();
  });
});

describe('fmtNum', () => {
  it('keeps answers short', () => {
    expect(fmtNum(1120)).toBe('1120');
    expect(fmtNum(1142.44)).toBe('1142.4');
    expect(fmtNum(22.844)).toBe('22.84');
    expect(fmtNum(2.5)).toBe('2.5');
    expect(fmtNum(0.0075)).toBe('0.0075');
    expect(fmtNum(1 / 3)).toBe('0.333');
    expect(fmtNum(-0)).toBe('0');
  });
});
