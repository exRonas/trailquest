import { describe, it, expect } from 'vitest';
import { emptyLocalizedText, pickLocalizedText } from '../types';

describe('pickLocalizedText', () => {
  it('prefers ru, falls back to en then kk', () => {
    expect(pickLocalizedText({ ru: 'Р', en: 'E', kk: 'K' })).toBe('Р');
    expect(pickLocalizedText({ ru: '', en: 'E', kk: 'K' })).toBe('E');
    expect(pickLocalizedText({ ru: '', en: '', kk: 'K' })).toBe('K');
  });

  it('returns empty string when nothing is filled in', () => {
    expect(pickLocalizedText(emptyLocalizedText())).toBe('');
  });
});

describe('emptyLocalizedText', () => {
  it('is all blank', () => {
    expect(emptyLocalizedText()).toEqual({ ru: '', en: '', kk: '' });
  });
});
