import test from 'node:test';
import assert from 'node:assert/strict';
import { interpretWisdomTask } from '../src/wisdom.js';

const store={overview:()=>({agents:3,contained:1,open_incidents:2,blocked_events:7})};
test('WISDOM navigates platform workflows',()=>assert.deepEqual(interpretWisdomTask('Show me the incidents',store).view,'incidents'));
test('WISDOM summarizes live security state',()=>assert.match(interpretWisdomTask('Give me a status summary',store).message,/3 protected agents/));
test('WISDOM requires approval for write actions',()=>assert.equal(interpretWisdomTask('Contain that agent',store).type,'approval_required'));
