
/* **********************************************
     Begin prism-jc62.js
********************************************** */

Prism.languages.jc62 = {
	'class-name': {
		pattern: /((?:\b(?:class|interface|extends|implements|trait|instanceof|new)\s+)|(?:catch\s+\())[\w.\\]+/i,
		lookbehind: true,
		inside: {
			punctuation: /[.\\]/
		}
	},
	'instruction': /\b(?:LDA|STA|MBA|ADD|SUB|JMP|JN|HLT)\b/,
	'pseudo': /\s*[#](?:ORG|DB)\b/,
	'function': /[a-z0-9_]+(?=\()/i,
	'hex': /\b[0-9A-F]{1,3}[h]?\b/i,
	'label': /\b[A-Za-z][:]\b/
};
