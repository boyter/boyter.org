/**
 * marked - a markdown parser
 * Copyright (c) 2011-2018, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/markedjs/marked
 */
!(function(e) {
  "use strict";
  var k = {
    newline: /^\n+/,
    code: /^( {4}[^\n]+\n*)+/,
    fences: f,
    hr: /^ {0,3}((?:- *){3,}|(?:_ *){3,}|(?:\* *){3,})(?:\n+|$)/,
    heading: /^ *(#{1,6}) *([^\n]+?) *(?:#+ *)?(?:\n+|$)/,
    nptable: f,
    blockquote: /^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/,
    list: /^( {0,3})(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,
    html:
      "^ {0,3}(?:<(script|pre|style)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?\\?>\\n*|<![A-Z][\\s\\S]*?>\\n*|<!\\[CDATA\\[[\\s\\S]*?\\]\\]>\\n*|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:\\n{2,}|$)|<(?!script|pre|style)([a-z][\\w-]*)(?:attribute)*? */?>(?=\\h*\\n)[\\s\\S]*?(?:\\n{2,}|$)|</(?!script|pre|style)[a-z][\\w-]*\\s*>(?=\\h*\\n)[\\s\\S]*?(?:\\n{2,}|$))",
    def: /^ {0,3}\[(label)\]: *\n? *<?([^\s>]+)>?(?:(?: +\n? *| *\n *)(title))? *(?:\n+|$)/,
    table: f,
    lheading: /^([^\n]+)\n *(=|-){2,} *(?:\n+|$)/,
    paragraph: /^([^\n]+(?:\n(?!hr|heading|lheading| {0,3}>|<\/?(?:tag)(?: +|\n|\/?>)|<(?:script|pre|style|!--))[^\n]+)*)/,
    text: /^[^\n]+/
  };
  function a(e) {
    (this.tokens = []), (this.tokens.links = Object.create(
      null
    )), (this.options = e || m.defaults), (this.rules = k.normal), this.options
      .pedantic
      ? (this.rules = k.pedantic)
      : this.options.gfm &&
        (this.options.tables ? (this.rules = k.tables) : (this.rules = k.gfm));
  }
  (k._label = /(?!\s*\])(?:\\[\[\]]|[^\[\]])+/), (k._title = /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/), (k.def = i(
    k.def
  )
    .replace("label", k._label)
    .replace("title", k._title)
    .getRegex()), (k.bullet = /(?:[*+-]|\d{1,9}\.)/), (k.item = /^( *)(bull) ?[^\n]*(?:\n(?!\1bull ?)[^\n]*)*/), (k.item = i(
    k.item,
    "gm"
  )
    .replace(/bull/g, k.bullet)
    .getRegex()), (k.list = i(k.list)
    .replace(/bull/g, k.bullet)
    .replace(
      "hr",
      "\\n+(?=\\1?(?:(?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$))"
    )
    .replace("def", "\\n+(?=" + k.def.source + ")")
    .getRegex()), (k._tag =
    "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|section|source|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul"), (k._comment = /<!--(?!-?>)[\s\S]*?-->/), (k.html = i(
    k.html,
    "i"
  )
    .replace("comment", k._comment)
    .replace("tag", k._tag)
    .replace(
      "attribute",
      / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/
    )
    .getRegex()), (k.paragraph = i(k.paragraph)
    .replace("hr", k.hr)
    .replace("heading", k.heading)
    .replace("lheading", k.lheading)
    .replace("tag", k._tag)
    .getRegex()), (k.blockquote = i(k.blockquote)
    .replace("paragraph", k.paragraph)
    .getRegex()), (k.normal = d({}, k)), (k.gfm = d({}, k.normal, {
    fences: /^ {0,3}(`{3,}|~{3,})([^`\n]*)\n(?:|([\s\S]*?)\n)(?: {0,3}\1[~`]* *(?:\n+|$)|$)/,
    paragraph: /^/,
    heading: /^ *(#{1,6}) +([^\n]+?) *#* *(?:\n+|$)/
  })), (k.gfm.paragraph = i(k.paragraph)
    .replace(
      "(?!",
      "(?!" +
        k.gfm.fences.source.replace("\\1", "\\2") +
        "|" +
        k.list.source.replace("\\1", "\\3") +
        "|"
    )
    .getRegex()), (k.tables = d({}, k.gfm, {
    nptable: /^ *([^|\n ].*\|.*)\n *([-:]+ *\|[-| :]*)(?:\n((?:.*[^>\n ].*(?:\n|$))*)\n*|$)/,
    table: /^ *\|(.+)\n *\|?( *[-:]+[-| :]*)(?:\n((?: *[^>\n ].*(?:\n|$))*)\n*|$)/
  })), (k.pedantic = d({}, k.normal, {
    html: i(
      "^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:\"[^\"]*\"|'[^']*'|\\s[^'\"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))"
    )
      .replace("comment", k._comment)
      .replace(
        /tag/g,
        "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b"
      )
      .getRegex(),
    def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/
  })), (a.rules = k), (a.lex = function(e, t) {
    return new a(t).lex(e);
  }), (a.prototype.lex = function(e) {
    return (e = e
      .replace(/\r\n|\r/g, "\n")
      .replace(/\t/g, "    ")
      .replace(/\u00a0/g, " ")
      .replace(/\u2424/g, "\n")), this.token(e, !0);
  }), (a.prototype.token = function(e, t) {
    var n, r, s, i, l, o, a, h, p, u, c, g, f, d, m, b;
    for (e = e.replace(/^ +$/gm, ""); e; )
      if (
        (
          (s = this.rules.newline.exec(e)) &&
            (
              (e = e.substring(s[0].length)),
              1 < s[0].length && this.tokens.push({ type: "space" })
            ),
          (s = this.rules.code.exec(e))
        )
      )
        (e = e.substring(s[0].length)), (s = s[0].replace(
          /^ {4}/gm,
          ""
        )), this.tokens.push({
          type: "code",
          text: this.options.pedantic ? s : y(s, "\n")
        });
      else if ((s = this.rules.fences.exec(e)))
        (e = e.substring(s[0].length)), this.tokens.push({
          type: "code",
          lang: s[2] ? s[2].trim() : s[2],
          text: s[3] || ""
        });
      else if ((s = this.rules.heading.exec(e)))
        (e = e.substring(s[0].length)), this.tokens.push({
          type: "heading",
          depth: s[1].length,
          text: s[2]
        });
      else if (
        t &&
        (s = this.rules.nptable.exec(e)) &&
        (o = {
          type: "table",
          header: x(s[1].replace(/^ *| *\| *$/g, "")),
          align: s[2].replace(/^ *|\| *$/g, "").split(/ *\| */),
          cells: s[3] ? s[3].replace(/\n$/, "").split("\n") : []
        }).header.length === o.align.length
      ) {
        for (e = e.substring(s[0].length), c = 0; c < o.align.length; c++)
          /^ *-+: *$/.test(o.align[c])
            ? (o.align[c] = "right")
            : /^ *:-+: *$/.test(o.align[c])
              ? (o.align[c] = "center")
              : /^ *:-+ *$/.test(o.align[c])
                ? (o.align[c] = "left")
                : (o.align[c] = null);
        for (c = 0; c < o.cells.length; c++)
          o.cells[c] = x(o.cells[c], o.header.length);
        this.tokens.push(o);
      } else if ((s = this.rules.hr.exec(e)))
        (e = e.substring(s[0].length)), this.tokens.push({ type: "hr" });
      else if ((s = this.rules.blockquote.exec(e)))
        (e = e.substring(s[0].length)), this.tokens.push({
          type: "blockquote_start"
        }), (s = s[0].replace(/^ *> ?/gm, "")), this.token(
          s,
          t
        ), this.tokens.push({ type: "blockquote_end" });
      else if ((s = this.rules.list.exec(e))) {
        for (
          e = e.substring(s[0].length), a = {
            type: "list_start",
            ordered: (d = 1 < (i = s[2]).length),
            start: d ? +i : "",
            loose: !1
          }, this.tokens.push(a), n = !(h = []), f = (s = s[0].match(
            this.rules.item
          )).length, c = 0;
          c < f;
          c++
        )
          (u = (o = s[c]).length), ~(o = o.replace(
            /^ *([*+-]|\d+\.) */,
            ""
          )).indexOf("\n ") &&
            (
              (u -= o.length),
              (o = this.options.pedantic
                ? o.replace(/^ {1,4}/gm, "")
                : o.replace(new RegExp("^ {1," + u + "}", "gm"), ""))
            ), c !== f - 1 &&
            (
              (l = k.bullet.exec(s[c + 1])[0]),
              (1 < i.length
                ? 1 === l.length
                : 1 < l.length || (this.options.smartLists && l !== i)) &&
                ((e = s.slice(c + 1).join("\n") + e), (c = f - 1))
            ), (r = n || /\n\n(?!\s*$)/.test(o)), c !== f - 1 &&
            ((n = "\n" === o.charAt(o.length - 1)), r || (r = n)), r &&
            (a.loose = !0), (b = void 0), (m = /^\[[ xX]\] /.test(o)) &&
            ((b = " " !== o[1]), (o = o.replace(/^\[[ xX]\] +/, ""))), (p = {
            type: "list_item_start",
            task: m,
            checked: b,
            loose: r
          }), h.push(p), this.tokens.push(p), this.token(
            o,
            !1
          ), this.tokens.push({ type: "list_item_end" });
        if (a.loose) for (f = h.length, c = 0; c < f; c++) h[c].loose = !0;
        this.tokens.push({ type: "list_end" });
      } else if ((s = this.rules.html.exec(e)))
        (e = e.substring(s[0].length)), this.tokens.push({
          type: this.options.sanitize ? "paragraph" : "html",
          pre:
            !this.options.sanitizer &&
            ("pre" === s[1] || "script" === s[1] || "style" === s[1]),
          text: s[0]
        });
      else if (t && (s = this.rules.def.exec(e)))
        (e = e.substring(s[0].length)), s[3] &&
          (s[3] = s[3].substring(
            1,
            s[3].length - 1
          )), (g = s[1].toLowerCase().replace(/\s+/g, " ")), this.tokens.links[
          g
        ] || (this.tokens.links[g] = { href: s[2], title: s[3] });
      else if (
        t &&
        (s = this.rules.table.exec(e)) &&
        (o = {
          type: "table",
          header: x(s[1].replace(/^ *| *\| *$/g, "")),
          align: s[2].replace(/^ *|\| *$/g, "").split(/ *\| */),
          cells: s[3] ? s[3].replace(/(?: *\| *)?\n$/, "").split("\n") : []
        }).header.length === o.align.length
      ) {
        for (e = e.substring(s[0].length), c = 0; c < o.align.length; c++)
          /^ *-+: *$/.test(o.align[c])
            ? (o.align[c] = "right")
            : /^ *:-+: *$/.test(o.align[c])
              ? (o.align[c] = "center")
              : /^ *:-+ *$/.test(o.align[c])
                ? (o.align[c] = "left")
                : (o.align[c] = null);
        for (c = 0; c < o.cells.length; c++)
          o.cells[c] = x(
            o.cells[c].replace(/^ *\| *| *\| *$/g, ""),
            o.header.length
          );
        this.tokens.push(o);
      } else if ((s = this.rules.lheading.exec(e)))
        (e = e.substring(s[0].length)), this.tokens.push({
          type: "heading",
          depth: "=" === s[2] ? 1 : 2,
          text: s[1]
        });
      else if (t && (s = this.rules.paragraph.exec(e)))
        (e = e.substring(s[0].length)), this.tokens.push({
          type: "paragraph",
          text: "\n" === s[1].charAt(s[1].length - 1) ? s[1].slice(0, -1) : s[1]
        });
      else if ((s = this.rules.text.exec(e)))
        (e = e.substring(s[0].length)), this.tokens.push({
          type: "text",
          text: s[0]
        });
      else if (e) throw new Error("Infinite loop on byte: " + e.charCodeAt(0));
    return this.tokens;
  });
  var n = {
    escape: /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,
    autolink: /^<(scheme:[^\s\x00-\x1f<>]*|email)>/,
    url: f,
    tag:
      "^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>",
    link: /^!?\[(label)\]\(href(?:\s+(title))?\s*\)/,
    reflink: /^!?\[(label)\]\[(?!\s*\])((?:\\[\[\]]?|[^\[\]\\])+)\]/,
    nolink: /^!?\[(?!\s*\])((?:\[[^\[\]]*\]|\\[\[\]]|[^\[\]])*)\](?:\[\])?/,
    strong: /^__([^\s_])__(?!_)|^\*\*([^\s*])\*\*(?!\*)|^__([^\s][\s\S]*?[^\s])__(?!_)|^\*\*([^\s][\s\S]*?[^\s])\*\*(?!\*)/,
    em: /^_([^\s_])_(?!_)|^\*([^\s*"<\[])\*(?!\*)|^_([^\s][\s\S]*?[^\s_])_(?!_|[^\spunctuation])|^_([^\s_][\s\S]*?[^\s])_(?!_|[^\spunctuation])|^\*([^\s"<\[][\s\S]*?[^\s*])\*(?!\*)|^\*([^\s*"<\[][\s\S]*?[^\s])\*(?!\*)/,
    code: /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,
    br: /^( {2,}|\\)\n(?!\s*$)/,
    del: f,
    text: /^(`+|[^`])[\s\S]*?(?=[\\<!\[`*]|\b_| {2,}\n|$)/
  };
  function h(e, t) {
    if (
      (
        (this.options = t || m.defaults),
        (this.links = e),
        (this.rules = n.normal),
        (this.renderer = this.options.renderer || new r()),
        (this.renderer.options = this.options),
        !this.links
      )
    )
      throw new Error("Tokens array requires a `links` property.");
    this.options.pedantic
      ? (this.rules = n.pedantic)
      : this.options.gfm &&
        (this.options.breaks ? (this.rules = n.breaks) : (this.rules = n.gfm));
  }
  function r(e) {
    this.options = e || m.defaults;
  }
  function s() {}
  function p(e) {
    (this.tokens = []), (this.token = null), (this.options =
      e || m.defaults), (this.options.renderer =
      this.options.renderer ||
      new r()), (this.renderer = this.options.renderer), (this.renderer.options = this.options), (this.slugger = new t());
  }
  function t() {
    this.seen = {};
  }
  function u(e, t) {
    if (t) {
      if (u.escapeTest.test(e))
        return e.replace(u.escapeReplace, function(e) {
          return u.replacements[e];
        });
    } else if (u.escapeTestNoEncode.test(e))
      return e.replace(u.escapeReplaceNoEncode, function(e) {
        return u.replacements[e];
      });
    return e;
  }
  function c(e) {
    return e.replace(/&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/gi, function(
      e,
      t
    ) {
      return "colon" === (t = t.toLowerCase())
        ? ":"
        : "#" === t.charAt(0)
          ? "x" === t.charAt(1)
            ? String.fromCharCode(parseInt(t.substring(2), 16))
            : String.fromCharCode(+t.substring(1))
          : "";
    });
  }
  function i(n, e) {
    return (n = n.source || n), (e = e || ""), {
      replace: function(e, t) {
        return (t = (t = t.source || t).replace(
          /(^|[^\[])\^/g,
          "$1"
        )), (n = n.replace(e, t)), this;
      },
      getRegex: function() {
        return new RegExp(n, e);
      }
    };
  }
  function l(e, t, n) {
    if (e) {
      try {
        var r = decodeURIComponent(c(n)).replace(/[^\w:]/g, "").toLowerCase();
      } catch (e) {
        return null;
      }
      if (
        0 === r.indexOf("javascript:") ||
        0 === r.indexOf("vbscript:") ||
        0 === r.indexOf("data:")
      )
        return null;
    }
    t &&
      !g.test(n) &&
      (n = (function(e, t) {
        o[" " + e] ||
          (/^[^:]+:\/*[^/]*$/.test(e)
            ? (o[" " + e] = e + "/")
            : (o[" " + e] = y(e, "/", !0)));
        return (e = o[" " + e]), "//" === t.slice(0, 2)
          ? e.replace(/:[\s\S]*/, ":") + t
          : "/" === t.charAt(0)
            ? e.replace(/(:\/*[^/]*)[\s\S]*/, "$1") + t
            : e + t;
      })(t, n));
    try {
      n = encodeURI(n).replace(/%25/g, "%");
    } catch (e) {
      return null;
    }
    return n;
  }
  (n._punctuation = "!\"#$%&'()*+,\\-./:;<=>?@\\[^_{|}~"), (n.em = i(n.em)
    .replace(/punctuation/g, n._punctuation)
    .getRegex()), (n._escapes = /\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/g), (n._scheme = /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/), (n._email = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/), (n.autolink = i(
    n.autolink
  )
    .replace("scheme", n._scheme)
    .replace("email", n._email)
    .getRegex()), (n._attribute = /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/), (n.tag = i(
    n.tag
  )
    .replace("comment", k._comment)
    .replace("attribute", n._attribute)
    .getRegex()), (n._label = /(?:\[[^\[\]]*\]|\\[\[\]]?|`[^`]*`|[^\[\]\\])*?/), (n._href = /\s*(<(?:\\[<>]?|[^\s<>\\])*>|(?:\\[()]?|\([^\s\x00-\x1f\\]*\)|[^\s\x00-\x1f()\\])*?)/), (n._title = /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/), (n.link = i(
    n.link
  )
    .replace("label", n._label)
    .replace("href", n._href)
    .replace("title", n._title)
    .getRegex()), (n.reflink = i(n.reflink)
    .replace("label", n._label)
    .getRegex()), (n.normal = d({}, n)), (n.pedantic = d({}, n.normal, {
    strong: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
    em: /^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/,
    link: i(/^!?\[(label)\]\((.*?)\)/).replace("label", n._label).getRegex(),
    reflink: i(/^!?\[(label)\]\s*\[([^\]]*)\]/)
      .replace("label", n._label)
      .getRegex()
  })), (n.gfm = d({}, n.normal, {
    escape: i(n.escape).replace("])", "~|])").getRegex(),
    _extended_email: /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/,
    url: /^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/,
    _backpedal: /(?:[^?!.,:;*_~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_~)]+(?!$))+/,
    del: /^~+(?=\S)([\s\S]*?\S)~+/,
    text: i(n.text)
      .replace("]|", "~]|")
      .replace(
        "|$",
        "|https?://|ftp://|www\\.|[a-zA-Z0-9.!#$%&'*+/=?^_`{\\|}~-]+@|$"
      )
      .getRegex()
  })), (n.gfm.url = i(n.gfm.url, "i")
    .replace("email", n.gfm._extended_email)
    .getRegex()), (n.breaks = d({}, n.gfm, {
    br: i(n.br).replace("{2,}", "*").getRegex(),
    text: i(n.gfm.text).replace("{2,}", "*").getRegex()
  })), (h.rules = n), (h.output = function(e, t, n) {
    return new h(t, n).output(e);
  }), (h.prototype.output = function(e) {
    for (var t, n, r, s, i, l, o = ""; e; )
      if ((i = this.rules.escape.exec(e)))
        (e = e.substring(i[0].length)), (o += u(i[1]));
      else if ((i = this.rules.tag.exec(e)))
        !this.inLink && /^<a /i.test(i[0])
          ? (this.inLink = !0)
          : this.inLink && /^<\/a>/i.test(i[0]) && (this.inLink = !1), !this
          .inRawBlock && /^<(pre|code|kbd|script)(\s|>)/i.test(i[0])
          ? (this.inRawBlock = !0)
          : this.inRawBlock &&
            /^<\/(pre|code|kbd|script)(\s|>)/i.test(i[0]) &&
            (this.inRawBlock = !1), (e = e.substring(i[0].length)), (o += this
          .options.sanitize
          ? this.options.sanitizer ? this.options.sanitizer(i[0]) : u(i[0])
          : i[0]);
      else if ((i = this.rules.link.exec(e)))
        (e = e.substring(i[0].length)), (this.inLink = !0), (r = i[2]), this
          .options.pedantic
          ? (t = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(r))
            ? ((r = t[1]), (s = t[3]))
            : (s = "")
          : (s = i[3] ? i[3].slice(1, -1) : ""), (r = r
          .trim()
          .replace(/^<([\s\S]*)>$/, "$1")), (o += this.outputLink(i, {
          href: h.escapes(r),
          title: h.escapes(s)
        })), (this.inLink = !1);
      else if (
        (i = this.rules.reflink.exec(e)) ||
        (i = this.rules.nolink.exec(e))
      ) {
        if (
          (
            (e = e.substring(i[0].length)),
            (t = (i[2] || i[1]).replace(/\s+/g, " ")),
            !(t = this.links[t.toLowerCase()]) || !t.href
          )
        ) {
          (o += i[0].charAt(0)), (e = i[0].substring(1) + e);
          continue;
        }
        (this.inLink = !0), (o += this.outputLink(i, t)), (this.inLink = !1);
      } else if ((i = this.rules.strong.exec(e)))
        (e = e.substring(i[0].length)), (o += this.renderer.strong(
          this.output(i[4] || i[3] || i[2] || i[1])
        ));
      else if ((i = this.rules.em.exec(e)))
        (e = e.substring(i[0].length)), (o += this.renderer.em(
          this.output(i[6] || i[5] || i[4] || i[3] || i[2] || i[1])
        ));
      else if ((i = this.rules.code.exec(e)))
        (e = e.substring(i[0].length)), (o += this.renderer.codespan(
          u(i[2].trim(), !0)
        ));
      else if ((i = this.rules.br.exec(e)))
        (e = e.substring(i[0].length)), (o += this.renderer.br());
      else if ((i = this.rules.del.exec(e)))
        (e = e.substring(i[0].length)), (o += this.renderer.del(
          this.output(i[1])
        ));
      else if ((i = this.rules.autolink.exec(e)))
        (e = e.substring(i[0].length)), (r =
          "@" === i[2]
            ? "mailto:" + (n = u(this.mangle(i[1])))
            : (n = u(i[1]))), (o += this.renderer.link(r, null, n));
      else if (this.inLink || !(i = this.rules.url.exec(e))) {
        if ((i = this.rules.text.exec(e)))
          (e = e.substring(i[0].length)), this.inRawBlock
            ? (o += this.renderer.text(i[0]))
            : (o += this.renderer.text(u(this.smartypants(i[0]))));
        else if (e)
          throw new Error("Infinite loop on byte: " + e.charCodeAt(0));
      } else {
        if ("@" === i[2]) r = "mailto:" + (n = u(i[0]));
        else {
          for (
            ;
            (l = i[0]), (i[0] = this.rules._backpedal.exec(i[0])[0]), l !==
              i[0];

          );
          (n = u(i[0])), (r = "www." === i[1] ? "http://" + n : n);
        }
        (e = e.substring(i[0].length)), (o += this.renderer.link(r, null, n));
      }
    return o;
  }), (h.escapes = function(e) {
    return e ? e.replace(h.rules._escapes, "$1") : e;
  }), (h.prototype.outputLink = function(e, t) {
    var n = t.href,
      r = t.title ? u(t.title) : null;
    return "!" !== e[0].charAt(0)
      ? this.renderer.link(n, r, this.output(e[1]))
      : this.renderer.image(n, r, u(e[1]));
  }), (h.prototype.smartypants = function(e) {
    return this.options.smartypants
      ? e
          .replace(/---/g, "—")
          .replace(/--/g, "–")
          .replace(/(^|[-\u2014/(\[{"\s])'/g, "$1‘")
          .replace(/'/g, "’")
          .replace(/(^|[-\u2014/(\[{\u2018\s])"/g, "$1“")
          .replace(/"/g, "”")
          .replace(/\.{3}/g, "…")
      : e;
  }), (h.prototype.mangle = function(e) {
    if (!this.options.mangle) return e;
    for (var t, n = "", r = e.length, s = 0; s < r; s++)
      (t = e.charCodeAt(s)), 0.5 < Math.random() &&
        (t = "x" + t.toString(16)), (n += "&#" + t + ";");
    return n;
  }), (r.prototype.code = function(e, t, n) {
    var r = (t || "").match(/\S*/)[0];
    if (this.options.highlight) {
      var s = this.options.highlight(e, r);
      null != s && s !== e && ((n = !0), (e = s));
    }
    return r
      ? '```<code class="' +
        this.options.langPrefix +
        u(r, !0) +
        '">' +
        (n ? e : u(e, !0)) +
        "</code>```\n"
      : "```<code>" + (n ? e : u(e, !0)) + "</code>```";
  }), (r.prototype.blockquote = function(e) {
    return "<blockquote>\n" + e + "</blockquote>\n";
  }), (r.prototype.html = function(e) {
    return e;
  }), (r.prototype.heading = function(e, t, n, r) {
    return this.options.headerIds
      ? "<h" +
        t +
        ' id="' +
        this.options.headerPrefix +
        r.slug(n) +
        '">' +
        e +
        "</h" +
        t +
        ">\n"
      : "<h" + t + ">" + e + "</h" + t + ">\n";
  }), (r.prototype.hr = function() {
    return this.options.xhtml ? "<hr/>\n" : "<hr>\n";
  }), (r.prototype.list = function(e, t, n) {
    var r = t ? "ol" : "ul";
    return (
      "<" +
      r +
      (t && 1 !== n ? ' start="' + n + '"' : "") +
      ">\n" +
      e +
      "</" +
      r +
      ">\n"
    );
  }), (r.prototype.listitem = function(e) {
    return "<li>" + e + "</li>\n";
  }), (r.prototype.checkbox = function(e) {
    return (
      "<input " +
      (e ? 'checked="" ' : "") +
      'disabled="" type="checkbox"' +
      (this.options.xhtml ? " /" : "") +
      "> "
    );
  }), (r.prototype.paragraph = function(e) {
    return "<p>" + e + "</p>\n";
  }), (r.prototype.table = function(e, t) {
    return t && (t = "<tbody>" + t + "</tbody>"), "<table>\n<thead>\n" +
      e +
      "</thead>\n" +
      t +
      "</table>\n";
  }), (r.prototype.tablerow = function(e) {
    return "<tr>\n" + e + "</tr>\n";
  }), (r.prototype.tablecell = function(e, t) {
    var n = t.header ? "th" : "td";
    return (
      (t.align ? "<" + n + ' align="' + t.align + '">' : "<" + n + ">") +
      e +
      "</" +
      n +
      ">\n"
    );
  }), (r.prototype.strong = function(e) {
    return "<strong>" + e + "</strong>";
  }), (r.prototype.em = function(e) {
    return "<em>" + e + "</em>";
  }), (r.prototype.codespan = function(e) {
    return "<code>" + e + "</code>";
  }), (r.prototype.br = function() {
    return this.options.xhtml ? "<br/>" : "<br>";
  }), (r.prototype.del = function(e) {
    return "<del>" + e + "</del>";
  }), (r.prototype.link = function(e, t, n) {
    if (null === (e = l(this.options.sanitize, this.options.baseUrl, e)))
      return n;
    var r = '<a href="' + u(e) + '"';
    return t && (r += ' title="' + t + '"'), (r += ">" + n + "</a>");
  }), (r.prototype.image = function(e, t, n) {
    if (null === (e = l(this.options.sanitize, this.options.baseUrl, e)))
      return n;
    var r = '<img src="' + e + '" alt="' + n + '"';
    return t && (r += ' title="' + t + '"'), (r += this.options.xhtml
      ? "/>"
      : ">");
  }), (r.prototype.text = function(e) {
    return e;
  }), (s.prototype.strong = s.prototype.em = s.prototype.codespan = s.prototype.del = s.prototype.text = function(
    e
  ) {
    return e;
  }), (s.prototype.link = s.prototype.image = function(e, t, n) {
    return "" + n;
  }), (s.prototype.br = function() {
    return "";
  }), (p.parse = function(e, t) {
    return new p(t).parse(e);
  }), (p.prototype.parse = function(e) {
    (this.inline = new h(e.links, this.options)), (this.inlineText = new h(
      e.links,
      d({}, this.options, { renderer: new s() })
    )), (this.tokens = e.reverse());
    for (var t = ""; this.next(); ) t += this.tok();
    return t;
  }), (p.prototype.next = function() {
    return (this.token = this.tokens.pop());
  }), (p.prototype.peek = function() {
    return this.tokens[this.tokens.length - 1] || 0;
  }), (p.prototype.parseText = function() {
    for (var e = this.token.text; "text" === this.peek().type; )
      e += "\n" + this.next().text;
    return this.inline.output(e);
  }), (p.prototype.tok = function() {
    switch (this.token.type) {
      case "space":
        return "";
      case "hr":
        return this.renderer.hr();
      case "heading":
        return this.renderer.heading(
          this.inline.output(this.token.text),
          this.token.depth,
          c(this.inlineText.output(this.token.text)),
          this.slugger
        );
      case "code":
        return this.renderer.code(
          this.token.text,
          this.token.lang,
          this.token.escaped
        );
      case "table":
        var e,
          t,
          n,
          r,
          s = "",
          i = "";
        for (n = "", e = 0; e < this.token.header.length; e++)
          n += this.renderer.tablecell(
            this.inline.output(this.token.header[e]),
            { header: !0, align: this.token.align[e] }
          );
        for (
          s += this.renderer.tablerow(n), e = 0;
          e < this.token.cells.length;
          e++
        ) {
          for (t = this.token.cells[e], n = "", r = 0; r < t.length; r++)
            n += this.renderer.tablecell(this.inline.output(t[r]), {
              header: !1,
              align: this.token.align[r]
            });
          i += this.renderer.tablerow(n);
        }
        return this.renderer.table(s, i);
      case "blockquote_start":
        for (i = ""; "blockquote_end" !== this.next().type; ) i += this.tok();
        return this.renderer.blockquote(i);
      case "list_start":
        i = "";
        for (
          var l = this.token.ordered, o = this.token.start;
          "list_end" !== this.next().type;

        )
          i += this.tok();
        return this.renderer.list(i, l, o);
      case "list_item_start":
        i = "";
        var a = this.token.loose;
        for (
          this.token.task && (i += this.renderer.checkbox(this.token.checked));
          "list_item_end" !== this.next().type;

        )
          i += a || "text" !== this.token.type ? this.tok() : this.parseText();
        return this.renderer.listitem(i);
      case "html":
        return this.renderer.html(this.token.text);
      case "paragraph":
        return this.renderer.paragraph(this.inline.output(this.token.text));
      case "text":
        return this.renderer.paragraph(this.parseText());
      default:
        var h = 'Token with "' + this.token.type + '" type was not found.';
        if (!this.options.silent) throw new Error(h);
        console.log(h);
    }
  }), (t.prototype.slug = function(e) {
    var t = e
      .toLowerCase()
      .trim()
      .replace(
        /[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~]/g,
        ""
      )
      .replace(/\s/g, "-");
    if (this.seen.hasOwnProperty(t))
      for (
        var n = t;
        this.seen[n]++, (t = n + "-" + this.seen[n]), this.seen.hasOwnProperty(
          t
        );

      );
    return (this.seen[t] = 0), t;
  }), (u.escapeTest = /[&<>"']/), (u.escapeReplace = /[&<>"']/g), (u.replacements = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }), (u.escapeTestNoEncode = /[<>"']|&(?!#?\w+;)/), (u.escapeReplaceNoEncode = /[<>"']|&(?!#?\w+;)/g);
  var o = {},
    g = /^$|^[a-z][a-z0-9+.-]*:|^[?#]/i;
  function f() {}
  function d(e) {
    for (var t, n, r = 1; r < arguments.length; r++)
      for (n in (t = arguments[r]))
        Object.prototype.hasOwnProperty.call(t, n) && (e[n] = t[n]);
    return e;
  }
  function x(e, t) {
    var n = e
        .replace(/\|/g, function(e, t, n) {
          for (var r = !1, s = t; 0 <= --s && "\\" === n[s]; ) r = !r;
          return r ? "|" : " |";
        })
        .split(/ \|/),
      r = 0;
    if (n.length > t) n.splice(t);
    else for (; n.length < t; ) n.push("");
    for (; r < n.length; r++) n[r] = n[r].trim().replace(/\\\|/g, "|");
    return n;
  }
  function y(e, t, n) {
    if (0 === e.length) return "";
    for (var r = 0; r < e.length; ) {
      var s = e.charAt(e.length - r - 1);
      if (s !== t || n) {
        if (s === t || !n) break;
        r++;
      } else r++;
    }
    return e.substr(0, e.length - r);
  }
  function m(e, n, r) {
    if (null == e)
      throw new Error("marked(): input parameter is undefined or null");
    if ("string" != typeof e)
      throw new Error(
        "marked(): input parameter is of type " +
          Object.prototype.toString.call(e) +
          ", string expected"
      );
    if (r || "function" == typeof n) {
      r || ((r = n), (n = null));
      var s,
        i,
        l = (n = d({}, m.defaults, n || {})).highlight,
        t = 0;
      try {
        s = a.lex(e, n);
      } catch (e) {
        return r(e);
      }
      i = s.length;
      var o = function(t) {
        if (t) return (n.highlight = l), r(t);
        var e;
        try {
          e = p.parse(s, n);
        } catch (e) {
          t = e;
        }
        return (n.highlight = l), t ? r(t) : r(null, e);
      };
      if (!l || l.length < 3) return o();
      if ((delete n.highlight, !i)) return o();
      for (; t < s.length; t++)
        !(function(n) {
          "code" !== n.type
            ? --i || o()
            : l(n.text, n.lang, function(e, t) {
                return e
                  ? o(e)
                  : null == t || t === n.text
                    ? --i || o()
                    : ((n.text = t), (n.escaped = !0), void (--i || o()));
              });
        })(s[t]);
    } else
      try {
        return n && (n = d({}, m.defaults, n)), p.parse(a.lex(e, n), n);
      } catch (e) {
        if (
          (
            (e.message +=
              "\nPlease report this to https://github.com/markedjs/marked."),
            (n || m.defaults).silent
          )
        )
          return "<p>An error occurred:</p>```" + u(e.message + "", !0) + "```";
        throw e;
      }
  }
  (f.exec = f), (m.options = m.setOptions = function(e) {
    return d(m.defaults, e), m;
  }), (m.getDefaults = function() {
    return {
      baseUrl: null,
      breaks: !1,
      gfm: !0,
      headerIds: !0,
      headerPrefix: "",
      highlight: null,
      langPrefix: "language-",
      mangle: !0,
      pedantic: !1,
      renderer: new r(),
      sanitize: !1,
      sanitizer: null,
      silent: !1,
      smartLists: !1,
      smartypants: !1,
      tables: !0,
      xhtml: !1
    };
  }), (m.defaults = m.getDefaults()), (m.Parser = p), (m.parser =
    p.parse), (m.Renderer = r), (m.TextRenderer = s), (m.Lexer = a), (m.lexer =
    a.lex), (m.InlineLexer = h), (m.inlineLexer =
    h.output), (m.Slugger = t), (m.parse = m), "undefined" != typeof module &&
  "object" == typeof exports
    ? (module.exports = m)
    : "function" == typeof define && define.amd
      ? define(function() {
          return m;
        })
      : (e.marked = m);
})(this || ("undefined" != typeof window ? window : global));
