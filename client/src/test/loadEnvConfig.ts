import { loadEnvConfig } from '@next/env';

async function loadEnv() {
  const projectDir = process.cwd();
  loadEnvConfig(projectDir);
}

export default loadEnv;
