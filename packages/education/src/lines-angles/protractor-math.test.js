import test from 'node:test';
import assert from 'node:assert/strict';
import {clampDegrees,pointOnRay,degreesFromPoint,degreesFromKey} from './protractor-math.js';
test('degree controls clamp and snap to integer degrees',()=>{
  assert.equal(clampDegrees(59.8),60);
  assert.equal(clampDegrees(-10),0);
  assert.equal(clampDegrees(181),180);
  assert.equal(clampDegrees(Infinity),0);
});
test('SVG geometry maps all cardinal directions and ignores vertex',()=>{
  assert.equal(degreesFromPoint(400,208),0);
  assert.equal(degreesFromPoint(220,40),90);
  assert.equal(degreesFromPoint(40,208),180);
  assert.equal(degreesFromPoint(220,208),null);
  for(const degrees of [0,25,55,60,75,100,120,180]){
    const p=pointOnRay(degrees,140);
    assert.equal(degreesFromPoint(p.x,p.y),degrees);
  }
  const left60=pointOnRay(120,140);
  assert.equal(180-degreesFromPoint(left60.x,left60.y),60);
});
test('below-baseline pointer remains on nearest endpoint',()=>{
  assert.equal(degreesFromPoint(300,250),0);
  assert.equal(degreesFromPoint(100,250),180);
});
test('keyboard supports exact steps, boundaries, and untouched unrelated keys',()=>{
  assert.equal(degreesFromKey('ArrowRight',59),60);
  assert.equal(degreesFromKey('ArrowUp',50,true),60);
  assert.equal(degreesFromKey('ArrowDown',5,true),0);
  assert.equal(degreesFromKey('End',60),180);
  assert.equal(degreesFromKey('Home',60),0);
  assert.equal(degreesFromKey('PageUp',175),180);
  assert.equal(degreesFromKey('PageDown',65),55);
  assert.equal(degreesFromKey('Tab',60),null);
});
