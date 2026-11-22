import { describe, expect, it } from 'vitest';
import { getServerSideProps } from 'pages/[bucket]/[[...path]]';
import type { HomeServerSideContext } from 'types/props';

function props(bucket: string, path?: string[]) {
  return getServerSideProps({ query: { bucket, path } } as HomeServerSideContext).props;
}

describe('getServerSideProps', () => {
  it('turns the catch-all segments into a slash-terminated path', () => {
    expect(props('b', ['docs', 'sub'])).toEqual({ bucket: 'b', path: 'docs/sub/' });
  });

  it('is an empty path at the bucket root', () => {
    expect(props('b')).toEqual({ bucket: 'b', path: '' });
  });
});
