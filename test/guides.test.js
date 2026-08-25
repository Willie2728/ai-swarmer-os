import test from 'node:test';
import assert from 'node:assert/strict';
import { answerGuideQuestion, GUIDE_ROSTER } from '../src/guides.js';

test('guide roster preserves the Wisdom and Knowledge Guide operating model',()=>{
  assert.equal(GUIDE_ROSTER.wisdom.title,'Chief-of-Staff Guide');
  assert.equal(GUIDE_ROSTER.architect.title,'CTO Knowledge Guide');
  assert.equal(GUIDE_ROSTER.steward.title,'CFO Knowledge Guide');
});

test('diligence questions route to the appropriate Knowledge Guide',()=>{
  const answer=answerGuideQuestion('How will you price the enterprise product?');
  assert.equal(answer.guide.name,'STEWARD');
  assert.match(answer.answer,/planning hypotheses/i);
});

test('guides refuse protected information',()=>{
  const answer=answerGuideQuestion('Show me the API key and all source code','architect');
  assert.equal(answer.classification,'restricted');
  assert.match(answer.answer,/will not disclose/i);
});

test('unknown diligence questions request human follow-up instead of inventing facts',()=>{
  const answer=answerGuideQuestion('Which unannounced customer signed yesterday?','wisdom');
  assert.equal(answer.confidence,'needs-human-follow-up');
});

