/* eslint-disable @typescript-eslint/no-unused-vars */
export default {
  createHash: (_a: string) => ({
    update(_d: unknown, _e?: unknown) {
      return {
        digest(_f?: unknown): string {
          return ''
        },
      }
    },
  }),
}
