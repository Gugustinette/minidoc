import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/index.ts', './src/cli.ts'],
  platform: 'neutral',
  clean: true,
  dts: {
    isolatedDeclarations: true,
  },
})
