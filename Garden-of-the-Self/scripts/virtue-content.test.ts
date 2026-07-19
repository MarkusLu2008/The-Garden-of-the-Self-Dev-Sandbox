/**
 * Integrity check for authored virtue content (Phase 8).
 * Run with: npm run test:content  (Node >= 22.6, native type stripping)
 *
 * Guards the spec's attribution caution: every quote is either a real
 * translation with a cited source, or explicitly marked as a paraphrase.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { VIRTUE_LIST } from '../constants/gameConfig.ts';
import { getVirtueContent, virtueContent } from '../data/virtue-content.ts';

test('every virtue in VIRTUE_LIST has authored content (13 total, spec count resolved)', () => {
  assert.equal(VIRTUE_LIST.length, 13);
  for (const virtue of VIRTUE_LIST) {
    const content = getVirtueContent(virtue);
    assert.ok(content, `missing content for ${virtue}`);
    assert.equal(content.virtue, virtue);
  }
  assert.equal(Object.keys(virtueContent).length, VIRTUE_LIST.length);
});

test('all content fields are substantive', () => {
  for (const content of Object.values(virtueContent)) {
    assert.ok(content.whyItMatters.length > 80, `${content.virtue}: whyItMatters too short`);
    assert.ok(content.plant.length > 2, `${content.virtue}: plant missing`);
    assert.ok(content.plantSymbolism.length > 40, `${content.virtue}: plantSymbolism too short`);
    assert.ok(content.quote.text.length > 10, `${content.virtue}: quote missing`);
  }
});

test('paraphrases are explicitly marked in the attribution; translations cite a source', () => {
  for (const content of Object.values(virtueContent)) {
    const { attribution, isParaphrase } = content.quote;
    if (isParaphrase) {
      assert.ok(
        /paraphrase|inspired/i.test(attribution),
        `${content.virtue}: paraphrase not marked in attribution`
      );
    } else {
      assert.ok(
        /trans\./.test(attribution),
        `${content.virtue}: genuine quote must cite a translation`
      );
    }
  }
});

test('unknown virtue name returns null', () => {
  assert.equal(getVirtueContent('Not A Virtue'), null);
});
