declare module 'turndown' {
  interface TurndownOptions {
    headingStyle?: 'setext' | 'atx'
    codeBlockStyle?: 'indented' | 'fenced'
    [key: string]: any
  }

  class TurndownService {
    constructor(options?: TurndownOptions)
    turndown(html: string): string
  }

  export = TurndownService
}
