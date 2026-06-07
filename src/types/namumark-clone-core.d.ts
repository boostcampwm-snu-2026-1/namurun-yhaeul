declare module 'namumark-clone-core' {
  interface NamuMarkConfig {
    docName: string
    [key: string]: unknown
  }

  interface NamuMarkDatabase {
    data: { data: string; title: string }[]
  }

  export class NamuMark {
    constructor(wikiText: string, config: NamuMarkConfig, database: NamuMarkDatabase)
    parse(): [string, string, Record<string, unknown>]
  }
}
