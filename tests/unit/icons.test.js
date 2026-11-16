import { icon, MIN_SIZE } from '../../src/platform/icons.js';

test('線條圖示 stroke-width 至少 2.5，尺寸至少 28px', () => {
  for (const name of ['volume', 'volumeOff', 'music', 'musicOff']) {
    const svg = icon(name, 10);
    expect(Number(svg.getAttribute('stroke-width'))).toBeGreaterThanOrEqual(2.5);
    expect(Number(svg.getAttribute('width'))).toBeGreaterThanOrEqual(MIN_SIZE);
    expect(svg.getAttribute('aria-hidden')).toBe('true');
  }
});

test('實心圖示可以建立，未知名稱會丟錯', () => {
  for (const name of ['home', 'kid', 'play', 'heart']) {
    expect(icon(name).tagName.toLowerCase()).toBe('svg');
  }
  expect(() => icon('nope')).toThrow();
});
