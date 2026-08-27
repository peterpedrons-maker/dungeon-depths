import test from 'node:test'; import assert from 'node:assert/strict';
import {createDruidCycle,advanceDruidSeason,markDruidAttunement,createDruidRenewal,addDruidDissonance} from './druid.ts';
test('druid advances seasons and caps resources',()=>{let c=createDruidCycle();c=markDruidAttunement(c,4);assert.equal(c.attunement,3);c=advanceDruidSeason(c);assert.equal(c.season,'summer');assert.equal(c.completed.has('spring'),true);c=createDruidRenewal(createDruidRenewal(c));assert.equal(c.renewals,1);assert.equal(addDruidDissonance(c,9).dissonance,3);});
