import { describe, it, expect } from 'vitest';
import { needsOnboarding, firstRunStep, initialOnboardingStep } from './onboarding';
import type { Screen } from './screens';

describe('needsOnboarding', () => {
  it('is true with zero profiles on a child-facing screen', () => {
    expect(needsOnboarding(0, { name: 'who' })).toBe(true);
    expect(needsOnboarding(0, { name: 'map' })).toBe(true);
    expect(needsOnboarding(0, { name: 'garden' })).toBe(true);
  });

  it('is true with zero profiles already on the onboarding screen', () => {
    expect(needsOnboarding(0, { name: 'onboarding', step: 'welcome' })).toBe(true);
  });

  it('is false once at least one profile exists', () => {
    expect(needsOnboarding(1, { name: 'who' })).toBe(false);
    expect(needsOnboarding(3, { name: 'onboarding', step: 'welcome' })).toBe(false);
  });

  it('does NOT hijack the parent flow even with zero profiles', () => {
    // The first-run path leads parents INTO the gate to create the first child;
    // hijacking the gate/area would make creation impossible.
    expect(needsOnboarding(0, { name: 'parentGate' })).toBe(false);
    expect(needsOnboarding(0, { name: 'parent' })).toBe(false);
  });
});

describe('firstRunStep', () => {
  it('advances to done as soon as a profile exists', () => {
    expect(firstRunStep(1, 'welcome')).toBe('done');
    expect(firstRunStep(2, 'done')).toBe('done');
  });

  it('stays on welcome while there are no profiles', () => {
    expect(firstRunStep(0, 'welcome')).toBe('welcome');
    // A stray `done` with no profiles resets to the interactive step.
    expect(firstRunStep(0, 'done')).toBe('welcome');
  });
});

describe('initialOnboardingStep', () => {
  it('starts at welcome', () => {
    expect(initialOnboardingStep()).toBe('welcome');
  });
});

// Type-level sanity: an onboarding Screen is well-formed.
const sample: Screen = { name: 'onboarding', step: 'welcome' };
describe('Screen.onboarding shape', () => {
  it('carries a step', () => {
    expect(sample.name === 'onboarding' && sample.step).toBe('welcome');
  });
});
