const string = /(?:"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n])*')/;

export const css = {
    'comment': /\/\*[\s\S]*?\*\//,
    'atrule': {
        pattern: RegExp('@[\\w-](?:' + /[^;{\s"']|\s+(?!\s)/.source + '|' + string.source + ')*?' + /(?:;|(?=\s*\{))/.source),
        inside: {
            'rule': /^@[\w-]+/,
            'selector-function-argument': {
                pattern: /(\bselector\s*\(\s*(?![\s)]))(?:[^()\s]|\s+(?![\s)])|\((?:[^()]|\([^()]*\))*\))+(?=\s*\))/,
                lookbehind: true,
                alias: 'selector'
            },
            'keyword': {
                pattern: /(^|[^\w-])(?:and|not|only|or)(?![\w-])/,
                lookbehind: true
            }
        }
    },
    'url': {
        pattern: RegExp('\\burl\\((?:' + string.source + '|' + /(?:[^\\\r\n()"']|\\[\s\S])*/.source + ')\\)', 'i'),
        greedy: true,
        inside: {
            'function': /^url/i,
            'punctuation': /^\(|\)$/,
            'string': {
                pattern: RegExp('^' + string.source + '$'),
                alias: 'url'
            }
        }
    },
    'selector': {
        pattern: RegExp('(^|[{}\\s])[^{}\\s](?:[^{};"\'\\s]|\\s+(?![\\s{])|' + string.source + ')*(?=\\s*\\{)'),
        lookbehind: true
    },
    'string': {
        pattern: string,
        greedy: true
    },
    'property': {
        pattern: /(^|[^-\w\xA0-\uFFFF])(?!\s)[-_a-z\xA0-\uFFFF](?:(?!\s)[-\w\xA0-\uFFFF])*(?=\s*:)/i,
        lookbehind: true
    },
    'important': /!important\b/i,
    'function': {
        pattern: /(^|[^-a-z0-9])[-a-z0-9]+(?=\()/i,
        lookbehind: true
    },
    'punctuation': /[(){};:,]/
};

css.atrule.inside.rest = css; 