/*
* The code for the LinkedList class and the code for tokenization of the code snippets
* was taken and adapted from Prism.js, https://prismjs.com
* */
import {markup} from './languages/markup.js';
import {css} from './languages/css.js';
import {javascript} from './languages/javascript.js';

class LinkedList {
  constructor() {
    const head = {value: null, prev: null, next: null};
    const tail = {value: null, prev: head, next: null};
    head.next = tail;

    this.head = head;
    this.tail = tail;
    this.length = 0;
  }

  addAfter(node, value) {
    const next = node.next;

    const newNode = {value, prev: node, next};
    node.next = newNode;
    next.prev = newNode;
    this.length++;

    return newNode;
  }

  removeRange(node, count) {
    let next = node.next;
    let i = 0;
    for(; i < count && next !== this.tail; i++) {
      next = next.next;
    }
    node.next = next;
    next.prev = node;
    this.length -= i;
  }

  toArray() {
    const array = [];
    let node = this.head.next;
    while(node !== this.tail) {
      array.push(node.value);
      node = node.next;
    }
    return array;
  }
}

class CodeSnippet extends HTMLElement {
  #languages = {
    html: markup,
    markup,
    css,
    javascript,
    js: javascript
  };

  #createToken(type, content, alias, matchedStr = '') {
    return {
      type,
      content,
      alias,
      length: matchedStr.length | 0
    };
  }

  constructor() {
    super();

    this.attachShadow({mode: 'open'});

    this.shadowRoot.innerHTML = /*html*/`
      <style>
        ::highlight(parameter) {
          color: #1a1a1a;
        }
        
        ::highlight(comment), ::highlight(prolog), ::highlight(doctype), ::highlight(cdata) {
          color: slategray;
        }
        
        ::highlight(punctuation) {
          color: #999;
        }
        
        ::highlight(property), 
        ::highlight(tag), 
        ::highlight(boolean), 
        ::highlight(number), 
        ::highlight(constant), 
        ::highlight(symbol), 
        ::highlight(deleted), 
        ::highlight(class-name) {
          color: #905;
        }
        
        ::highlight(selector), 
        ::highlight(attr-name), 
        ::highlight(string), 
        ::highlight(char), 
        ::highlight(builtin), 
        ::highlight(inserted) {
          color: #690;
        }
        
        ::highlight(operator), ::highlight(entity), ::highlight(url) {
          color: #a67f59;
          background: hsla(0, 0%, 100%, 0.5);
        }
        
        ::highlight(atrule), ::highlight(attr-value), ::highlight(keyword) {
          color: #07a;
        }
        
        ::highlight(function) {
          color: #dd4a68;
        }
        
        ::highlight(regex), ::highlight(important), ::highlight(variable) {
          color: #e90;
        }
        
        ::highlight(important), ::highlight(bold) {
          font-weight: bold;
        }
        
        ::highlight(italic) {
          font-style: italic;
        }
        
        ::highlight(entity) {
          cursor: help;
        }
        
        ::slotted(*) {
          border: 1px solid #cecece;
          width: 80vw;
          height: 30vh;
          margin-inline: auto;
          display: block;
          white-space: pre;
          padding: 1em;
          background: #fafafa;
          font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
          overflow-x: auto;
          tab-size: 2;
          color: #1a1a1a;
          line-height: 1.6;
        }
      </style>

      <slot></slot>
    `;

    const tokenTypes = [
      'comment',
      'prolog',
      'doctype',
      'cdata',
      'punctuation',
      'namespace',
      'property',
      'tag',
      'boolean',
      'number',
      'constant',
      'symbol',
      'deleted',
      'selector',
      'attr',
      'string',
      'char',
      'builtin',
      'inserted',
      'operator',
      'entity',
      'url',
      'string',
      'atrule',
      'attr',
      'keyword',
      'function',
      'class',
      'regex',
      'important',
      'variable',
      'important',
      'bold',
      'italic',
      'entity',
      'parameter',
      'class-name'
    ];

    tokenTypes.forEach(tokenType => {
      CSS.highlights.set(tokenType, new Highlight());
    });

    this.addEventListener('slotchange', this.#createHighlights);
    this.#createHighlights();
  }

  #createHighlights = () => {
    const slot = this.shadowRoot.querySelector('slot');
    const nodes = slot.assignedElements();

    if(nodes.length === 0) {
      console.warn('No code to highlight');
      return;
    }

    for (const textNode of nodes) {
      const textContentNode = textNode.firstChild
      const code = textNode?.textContent ?? '';
      const lang = textNode?.getAttribute('lang') ?? 'text';
      const grammar = this.#languages[lang];
      if(!grammar) {
        console.warn(`Language '${lang}' is not supported`);
        return;
      }

      const tokens = this.tokenize(code, grammar);

      let pos = 0;
      for(const token of tokens) {
        if(token.type) {
          const range = new Range();
          range.setStart(textContentNode, pos);
          range.setEnd(textContentNode, pos + token.length);
          CSS.highlights.get(token.alias ?? token.type)?.add(range);
        }
        pos += token.length;
      }
    }
  };

  #matchPattern(pattern, pos, text, lookbehind) {
    pattern.lastIndex = pos;
    const match = pattern.exec(text);
    if(match && lookbehind && match[1]) {
      const lookbehindLength = match[1].length;
      match.index += lookbehindLength;
      match[0] = match[0].slice(lookbehindLength);
    }
    return match;
  }

  #matchGrammar(text, tokenList, grammar, startNode, startPos, rematch) {
    for(const token in grammar) {
      if(!grammar.hasOwnProperty(token) || !grammar[token]) {
        continue;
      }

      let patterns = grammar[token];
      patterns = Array.isArray(patterns) ? patterns : [patterns];

      for(let j = 0; j < patterns.length; ++j) {
        if(rematch && rematch.cause == token + ',' + j) {
          return;
        }

        const patternObj = patterns[j];
        const inside = patternObj.inside;
        const lookbehind = !!patternObj.lookbehind;
        const greedy = !!patternObj.greedy;
        const alias = patternObj.alias;

        if(greedy && !patternObj.pattern.global) {
          const flags = patternObj.pattern.toString().match(/[imsuy]*$/)[0];
          patternObj.pattern = RegExp(patternObj.pattern.source, flags + 'g');
        }

        const pattern = patternObj.pattern || patternObj;

        for(
          let currentNode = startNode.next, pos = startPos;
          currentNode !== tokenList.tail;
          pos += currentNode.value.length, currentNode = currentNode.next
        ) {
          if(rematch && pos >= rematch.reach) {
            break;
          }

          let str = currentNode.value;

          if(tokenList.length > text.length) {
            return;
          }

          if(typeof str === 'object' && str.type) {
            continue;
          }

          let removeCount = 1;
          let match;

          if(greedy) {
            match = this.#matchPattern(pattern, pos, text, lookbehind);
            if(!match || match.index >= text.length) {
              break;
            }

            const from = match.index;
            const to = match.index + match[0].length;
            let p = pos;

            p += currentNode.value.length;
            while(from >= p) {
              currentNode = currentNode.next;
              p += currentNode.value.length;
            }
            p -= currentNode.value.length;
            pos = p;

            if(typeof currentNode.value === 'object' && currentNode.value.type) {
              continue;
            }

            for(
              let k = currentNode;
              k !== tokenList.tail && (p < to || typeof k.value === 'string');
              k = k.next
            ) {
              removeCount++;
              p += k.value.length;
            }
            removeCount--;

            str = text.slice(pos, p);
            match.index -= pos;
          }
          else {
            match = this.#matchPattern(pattern, 0, str, lookbehind);
            if(!match) {
              continue;
            }
          }

          const from = match.index;
          const matchStr = match[0];
          const before = str.slice(0, from);
          const after = str.slice(from + matchStr.length);

          const reach = pos + str.length;
          if(rematch && reach > rematch.reach) {
            rematch.reach = reach;
          }

          let removeFrom = currentNode.prev;

          if(before) {
            removeFrom = tokenList.addAfter(removeFrom, before);
            pos += before.length;
          }

          tokenList.removeRange(removeFrom, removeCount);

          const wrapped = this.#createToken(token, inside ? this.tokenize(matchStr, inside) : matchStr, alias, matchStr);
          currentNode = tokenList.addAfter(removeFrom, wrapped);

          if(after) {
            tokenList.addAfter(currentNode, after);
          }

          if(removeCount > 1) {
            const nestedRematch = {
              cause: token + ',' + j,
              reach
            };
            this.#matchGrammar(text, tokenList, grammar, currentNode.prev, pos, nestedRematch);

            if(rematch && nestedRematch.reach > rematch.reach) {
              rematch.reach = nestedRematch.reach;
            }
          }
        }
      }
    }
  }

  tokenize(text, grammar) {
    const rest = grammar.rest;
    if(rest) {
      for(const token in rest) {
        grammar[token] = rest[token];
      }
      delete grammar.rest;
    }

    const tokenList = new LinkedList();
    tokenList.addAfter(tokenList.head, text);

    this.#matchGrammar(text, tokenList, grammar, tokenList.head, 0);

    return tokenList.toArray();
  }
}

customElements.define('code-snippet', CodeSnippet);
