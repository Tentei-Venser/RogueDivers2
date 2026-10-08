import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { execFileSync } from 'node:child_process'

function gitValue(args: string[]): string {
  try {
    return execFileSync('git', args, { encoding: 'utf8' }).trim() || 'local'
  } catch {
    return 'local'
  }
}

const appVersion = gitValue([
  'rev-list', '--count', '--first-parent', 'HEAD', '--', '.', ':(exclude)src/data/**',
])
const dataVersion = gitValue([
  'rev-list', '--count', '--first-parent', 'HEAD', '--', 'src/data',
])
const commitSha = gitValue(['rev-parse', '--short=7', 'HEAD'])

// https://vite.dev/config/
export default defineConfig({
  base: '/RogueDivers2/',
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __DATA_VERSION__: JSON.stringify(dataVersion),
    __COMMIT_SHA__: JSON.stringify(commitSha),
  },
})
