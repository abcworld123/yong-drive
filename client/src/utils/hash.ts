export async function sha256Hex(text: string): Promise<string> {
  // crypto.subtle only exists in secure contexts (HTTPS or localhost).
  if (!globalThis.crypto?.subtle) throw new Error('HTTPS에서만 로그인할 수 있습니다.');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}
