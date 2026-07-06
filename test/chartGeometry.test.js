import test from 'node:test';
import assert from 'node:assert/strict';
import { avoidCircleLabelCollision } from '../src/utils/chartGeometry.js';

test('chart labels keep their position when clear and move above nearby circles', () => {
  assert.equal(avoidCircleLabelCollision(40, 100), 40);
  assert.equal(avoidCircleLabelCollision(80, 100), 66);
});

test('chart labels move below a circle when there is not enough room above', () => {
  assert.equal(avoidCircleLabelCollision(25, 30, { minimum: 20, clearance: 34 }), 64);
});
