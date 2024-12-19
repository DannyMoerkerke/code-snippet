# code-snippet
A syntax highlighting web component that uses the CSS Custom Hightlight API for syntax highlighting.

This replaces the practice of injecting `<span>` elements for syntax highlighting with a pure CSS solution.

It currently supports JavaScript, CSS and HTML.

The code for the LinkedList class and the code for tokenization of the code snippets was taken and adapted from Prism.js, https://prismjs.com


## Usage

```html
<script type="module" src="code-snippet.js"></script>

<code-snippet>
  
  <span lang="javascript">
console.log('hello there')    
  </span>
  
  <span lang="css">
body {
  color: red;
}    
  </span>
  
  <span lang="html">
&lt;p&gt;Hello there&lt;/p&gt;    
  </span>
</code-snippet>

```
