var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/cash-dom/dist/cash.js
var require_cash = __commonJS({
  "node_modules/cash-dom/dist/cash.js"(exports, module) {
    (function() {
      "use strict";
      var doc = document;
      var win = window;
      var docEle = doc.documentElement;
      var createElement = doc.createElement.bind(doc);
      var div = createElement("div");
      var table = createElement("table");
      var tbody = createElement("tbody");
      var tr = createElement("tr");
      var isArray = Array.isArray, ArrayPrototype = Array.prototype;
      var concat = ArrayPrototype.concat, filter = ArrayPrototype.filter, indexOf = ArrayPrototype.indexOf, map = ArrayPrototype.map, push = ArrayPrototype.push, slice = ArrayPrototype.slice, some = ArrayPrototype.some, splice = ArrayPrototype.splice;
      var idRe = /^#(?:[\w-]|\\.|[^\x00-\xa0])*$/;
      var classRe = /^\.(?:[\w-]|\\.|[^\x00-\xa0])*$/;
      var htmlRe = /<.+>/;
      var tagRe = /^\w+$/;
      function find(selector, context) {
        var isFragment = isDocumentFragment(context);
        return !selector || !isFragment && !isDocument(context) && !isElement(context) ? [] : !isFragment && classRe.test(selector) ? context.getElementsByClassName(selector.slice(1).replace(/\\/g, "")) : !isFragment && tagRe.test(selector) ? context.getElementsByTagName(selector) : context.querySelectorAll(selector);
      }
      var Cash = (
        /** @class */
        function() {
          function Cash2(selector, context) {
            if (!selector)
              return;
            if (isCash(selector))
              return selector;
            var eles = selector;
            if (isString(selector)) {
              var ctx = context || doc;
              eles = idRe.test(selector) && isDocument(ctx) ? ctx.getElementById(selector.slice(1).replace(/\\/g, "")) : htmlRe.test(selector) ? parseHTML(selector) : isCash(ctx) ? ctx.find(selector) : isString(ctx) ? cash4(ctx).find(selector) : find(selector, ctx);
              if (!eles)
                return;
            } else if (isFunction(selector)) {
              return this.ready(selector);
            }
            if (eles.nodeType || eles === win)
              eles = [eles];
            this.length = eles.length;
            for (var i = 0, l = this.length; i < l; i++) {
              this[i] = eles[i];
            }
          }
          Cash2.prototype.init = function(selector, context) {
            return new Cash2(selector, context);
          };
          return Cash2;
        }()
      );
      var fn = Cash.prototype;
      var cash4 = fn.init;
      cash4.fn = cash4.prototype = fn;
      fn.length = 0;
      fn.splice = splice;
      if (typeof Symbol === "function") {
        fn[Symbol["iterator"]] = ArrayPrototype[Symbol["iterator"]];
      }
      function isCash(value) {
        return value instanceof Cash;
      }
      function isWindow(value) {
        return !!value && value === value.window;
      }
      function isDocument(value) {
        return !!value && value.nodeType === 9;
      }
      function isDocumentFragment(value) {
        return !!value && value.nodeType === 11;
      }
      function isElement(value) {
        return !!value && value.nodeType === 1;
      }
      function isText(value) {
        return !!value && value.nodeType === 3;
      }
      function isBoolean(value) {
        return typeof value === "boolean";
      }
      function isFunction(value) {
        return typeof value === "function";
      }
      function isString(value) {
        return typeof value === "string";
      }
      function isUndefined(value) {
        return value === void 0;
      }
      function isNull(value) {
        return value === null;
      }
      function isNumeric(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
      }
      function isPlainObject(value) {
        if (typeof value !== "object" || value === null)
          return false;
        var proto = Object.getPrototypeOf(value);
        return proto === null || proto === Object.prototype;
      }
      cash4.isWindow = isWindow;
      cash4.isFunction = isFunction;
      cash4.isArray = isArray;
      cash4.isNumeric = isNumeric;
      cash4.isPlainObject = isPlainObject;
      function each(arr, callback, _reverse) {
        if (_reverse) {
          var i = arr.length;
          while (i--) {
            if (callback.call(arr[i], i, arr[i]) === false)
              return arr;
          }
        } else if (isPlainObject(arr)) {
          var keys = Object.keys(arr);
          for (var i = 0, l = keys.length; i < l; i++) {
            var key = keys[i];
            if (callback.call(arr[key], key, arr[key]) === false)
              return arr;
          }
        } else {
          for (var i = 0, l = arr.length; i < l; i++) {
            if (callback.call(arr[i], i, arr[i]) === false)
              return arr;
          }
        }
        return arr;
      }
      cash4.each = each;
      fn.each = function(callback) {
        return each(this, callback);
      };
      fn.empty = function() {
        return this.each(function(i, ele) {
          while (ele.firstChild) {
            ele.removeChild(ele.firstChild);
          }
        });
      };
      function extend() {
        var sources = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          sources[_i] = arguments[_i];
        }
        var deep = isBoolean(sources[0]) ? sources.shift() : false;
        var target = sources.shift();
        var length = sources.length;
        if (!target)
          return {};
        if (!length)
          return extend(deep, cash4, target);
        for (var i = 0; i < length; i++) {
          var source = sources[i];
          for (var key in source) {
            if (deep && (isArray(source[key]) || isPlainObject(source[key]))) {
              if (!target[key] || target[key].constructor !== source[key].constructor)
                target[key] = new source[key].constructor();
              extend(deep, target[key], source[key]);
            } else {
              target[key] = source[key];
            }
          }
        }
        return target;
      }
      cash4.extend = extend;
      fn.extend = function(plugins) {
        return extend(fn, plugins);
      };
      var splitValuesRe = /\S+/g;
      function getSplitValues(str) {
        return isString(str) ? str.match(splitValuesRe) || [] : [];
      }
      fn.toggleClass = function(cls, force) {
        var classes = getSplitValues(cls);
        var isForce = !isUndefined(force);
        return this.each(function(i, ele) {
          if (!isElement(ele))
            return;
          each(classes, function(i2, c) {
            if (isForce) {
              force ? ele.classList.add(c) : ele.classList.remove(c);
            } else {
              ele.classList.toggle(c);
            }
          });
        });
      };
      fn.addClass = function(cls) {
        return this.toggleClass(cls, true);
      };
      fn.removeAttr = function(attr2) {
        var attrs = getSplitValues(attr2);
        return this.each(function(i, ele) {
          if (!isElement(ele))
            return;
          each(attrs, function(i2, a) {
            ele.removeAttribute(a);
          });
        });
      };
      function attr(attr2, value) {
        if (!attr2)
          return;
        if (isString(attr2)) {
          if (arguments.length < 2) {
            if (!this[0] || !isElement(this[0]))
              return;
            var value_1 = this[0].getAttribute(attr2);
            return isNull(value_1) ? void 0 : value_1;
          }
          if (isUndefined(value))
            return this;
          if (isNull(value))
            return this.removeAttr(attr2);
          return this.each(function(i, ele) {
            if (!isElement(ele))
              return;
            ele.setAttribute(attr2, value);
          });
        }
        for (var key in attr2) {
          this.attr(key, attr2[key]);
        }
        return this;
      }
      fn.attr = attr;
      fn.removeClass = function(cls) {
        if (arguments.length)
          return this.toggleClass(cls, false);
        return this.attr("class", "");
      };
      fn.hasClass = function(cls) {
        return !!cls && some.call(this, function(ele) {
          return isElement(ele) && ele.classList.contains(cls);
        });
      };
      fn.get = function(index) {
        if (isUndefined(index))
          return slice.call(this);
        index = Number(index);
        return this[index < 0 ? index + this.length : index];
      };
      fn.eq = function(index) {
        return cash4(this.get(index));
      };
      fn.first = function() {
        return this.eq(0);
      };
      fn.last = function() {
        return this.eq(-1);
      };
      function text(text2) {
        if (isUndefined(text2)) {
          return this.get().map(function(ele) {
            return isElement(ele) || isText(ele) ? ele.textContent : "";
          }).join("");
        }
        return this.each(function(i, ele) {
          if (!isElement(ele))
            return;
          ele.textContent = text2;
        });
      }
      fn.text = text;
      function computeStyle(ele, prop, isVariable) {
        if (!isElement(ele))
          return;
        var style2 = win.getComputedStyle(ele, null);
        return isVariable ? style2.getPropertyValue(prop) || void 0 : style2[prop] || ele.style[prop];
      }
      function computeStyleInt(ele, prop) {
        return parseInt(computeStyle(ele, prop), 10) || 0;
      }
      function getExtraSpace(ele, xAxis) {
        return computeStyleInt(ele, "border".concat(xAxis ? "Left" : "Top", "Width")) + computeStyleInt(ele, "padding".concat(xAxis ? "Left" : "Top")) + computeStyleInt(ele, "padding".concat(xAxis ? "Right" : "Bottom")) + computeStyleInt(ele, "border".concat(xAxis ? "Right" : "Bottom", "Width"));
      }
      var defaultDisplay = {};
      function getDefaultDisplay(tagName) {
        if (defaultDisplay[tagName])
          return defaultDisplay[tagName];
        var ele = createElement(tagName);
        doc.body.insertBefore(ele, null);
        var display = computeStyle(ele, "display");
        doc.body.removeChild(ele);
        return defaultDisplay[tagName] = display !== "none" ? display : "block";
      }
      function isHidden(ele) {
        return computeStyle(ele, "display") === "none";
      }
      function matches(ele, selector) {
        var matches2 = ele && (ele["matches"] || ele["webkitMatchesSelector"] || ele["msMatchesSelector"]);
        return !!matches2 && !!selector && matches2.call(ele, selector);
      }
      function getCompareFunction(comparator) {
        return isString(comparator) ? function(i, ele) {
          return matches(ele, comparator);
        } : isFunction(comparator) ? comparator : isCash(comparator) ? function(i, ele) {
          return comparator.is(ele);
        } : !comparator ? function() {
          return false;
        } : function(i, ele) {
          return ele === comparator;
        };
      }
      fn.filter = function(comparator) {
        var compare = getCompareFunction(comparator);
        return cash4(filter.call(this, function(ele, i) {
          return compare.call(ele, i, ele);
        }));
      };
      function filtered(collection, comparator) {
        return !comparator ? collection : collection.filter(comparator);
      }
      fn.detach = function(comparator) {
        filtered(this, comparator).each(function(i, ele) {
          if (ele.parentNode) {
            ele.parentNode.removeChild(ele);
          }
        });
        return this;
      };
      var fragmentRe = /^\s*<(\w+)[^>]*>/;
      var singleTagRe = /^<(\w+)\s*\/?>(?:<\/\1>)?$/;
      var containers = {
        "*": div,
        tr: tbody,
        td: tr,
        th: tr,
        thead: table,
        tbody: table,
        tfoot: table
      };
      function parseHTML(html3) {
        if (!isString(html3))
          return [];
        if (singleTagRe.test(html3))
          return [createElement(RegExp.$1)];
        var fragment = fragmentRe.test(html3) && RegExp.$1;
        var container = containers[fragment] || containers["*"];
        container.innerHTML = html3;
        return cash4(container.childNodes).detach().get();
      }
      cash4.parseHTML = parseHTML;
      fn.has = function(selector) {
        var comparator = isString(selector) ? function(i, ele) {
          return find(selector, ele).length;
        } : function(i, ele) {
          return ele.contains(selector);
        };
        return this.filter(comparator);
      };
      fn.not = function(comparator) {
        var compare = getCompareFunction(comparator);
        return this.filter(function(i, ele) {
          return (!isString(comparator) || isElement(ele)) && !compare.call(ele, i, ele);
        });
      };
      function pluck(arr, prop, deep, until) {
        var plucked = [];
        var isCallback = isFunction(prop);
        var compare = until && getCompareFunction(until);
        for (var i = 0, l = arr.length; i < l; i++) {
          if (isCallback) {
            var val_1 = prop(arr[i]);
            if (val_1.length)
              push.apply(plucked, val_1);
          } else {
            var val_2 = arr[i][prop];
            while (val_2 != null) {
              if (until && compare(-1, val_2))
                break;
              plucked.push(val_2);
              val_2 = deep ? val_2[prop] : null;
            }
          }
        }
        return plucked;
      }
      function getValue(ele) {
        if (ele.multiple && ele.options)
          return pluck(filter.call(ele.options, function(option) {
            return option.selected && !option.disabled && !option.parentNode.disabled;
          }), "value");
        return ele.value || "";
      }
      function val(value) {
        if (!arguments.length)
          return this[0] && getValue(this[0]);
        return this.each(function(i, ele) {
          var isSelect = ele.multiple && ele.options;
          if (isSelect || checkableRe.test(ele.type)) {
            var eleValue_1 = isArray(value) ? map.call(value, String) : isNull(value) ? [] : [String(value)];
            if (isSelect) {
              each(ele.options, function(i2, option) {
                option.selected = eleValue_1.indexOf(option.value) >= 0;
              }, true);
            } else {
              ele.checked = eleValue_1.indexOf(ele.value) >= 0;
            }
          } else {
            ele.value = isUndefined(value) || isNull(value) ? "" : value;
          }
        });
      }
      fn.val = val;
      fn.is = function(comparator) {
        var compare = getCompareFunction(comparator);
        return some.call(this, function(ele, i) {
          return compare.call(ele, i, ele);
        });
      };
      cash4.guid = 1;
      function unique(arr) {
        return arr.length > 1 ? filter.call(arr, function(item, index, self) {
          return indexOf.call(self, item) === index;
        }) : arr;
      }
      cash4.unique = unique;
      fn.add = function(selector, context) {
        return cash4(unique(this.get().concat(cash4(selector, context).get())));
      };
      fn.children = function(comparator) {
        return filtered(cash4(unique(pluck(this, function(ele) {
          return ele.children;
        }))), comparator);
      };
      fn.parent = function(comparator) {
        return filtered(cash4(unique(pluck(this, "parentNode"))), comparator);
      };
      fn.index = function(selector) {
        var child = selector ? cash4(selector)[0] : this[0];
        var collection = selector ? this : cash4(child).parent().children();
        return indexOf.call(collection, child);
      };
      fn.closest = function(comparator) {
        var filtered2 = this.filter(comparator);
        if (filtered2.length)
          return filtered2;
        var $parent = this.parent();
        if (!$parent.length)
          return filtered2;
        return $parent.closest(comparator);
      };
      fn.siblings = function(comparator) {
        return filtered(cash4(unique(pluck(this, function(ele) {
          return cash4(ele).parent().children().not(ele);
        }))), comparator);
      };
      fn.find = function(selector) {
        return cash4(unique(pluck(this, function(ele) {
          return find(selector, ele);
        })));
      };
      var HTMLCDATARe = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g;
      var scriptTypeRe = /^$|^module$|\/(java|ecma)script/i;
      var scriptAttributes = ["type", "src", "nonce", "noModule"];
      function evalScripts(node, doc2) {
        var collection = cash4(node);
        collection.filter("script").add(collection.find("script")).each(function(i, ele) {
          if (scriptTypeRe.test(ele.type) && docEle.contains(ele)) {
            var script_1 = createElement("script");
            script_1.text = ele.textContent.replace(HTMLCDATARe, "");
            each(scriptAttributes, function(i2, attr2) {
              if (ele[attr2])
                script_1[attr2] = ele[attr2];
            });
            doc2.head.insertBefore(script_1, null);
            doc2.head.removeChild(script_1);
          }
        });
      }
      function insertElement(anchor, target, left, inside, evaluate) {
        if (inside) {
          anchor.insertBefore(target, left ? anchor.firstChild : null);
        } else {
          if (anchor.nodeName === "HTML") {
            anchor.parentNode.replaceChild(target, anchor);
          } else {
            anchor.parentNode.insertBefore(target, left ? anchor : anchor.nextSibling);
          }
        }
        if (evaluate) {
          evalScripts(target, anchor.ownerDocument);
        }
      }
      function insertSelectors(selectors, anchors, inverse, left, inside, reverseLoop1, reverseLoop2, reverseLoop3) {
        each(selectors, function(si, selector) {
          each(cash4(selector), function(ti, target) {
            each(cash4(anchors), function(ai, anchor) {
              var anchorFinal = inverse ? target : anchor;
              var targetFinal = inverse ? anchor : target;
              var indexFinal = inverse ? ti : ai;
              insertElement(anchorFinal, !indexFinal ? targetFinal : targetFinal.cloneNode(true), left, inside, !indexFinal);
            }, reverseLoop3);
          }, reverseLoop2);
        }, reverseLoop1);
        return anchors;
      }
      fn.after = function() {
        return insertSelectors(arguments, this, false, false, false, true, true);
      };
      fn.append = function() {
        return insertSelectors(arguments, this, false, false, true);
      };
      function html2(html3) {
        if (!arguments.length)
          return this[0] && this[0].innerHTML;
        if (isUndefined(html3))
          return this;
        var hasScript = /<script[\s>]/.test(html3);
        return this.each(function(i, ele) {
          if (!isElement(ele))
            return;
          if (hasScript) {
            cash4(ele).empty().append(html3);
          } else {
            ele.innerHTML = html3;
          }
        });
      }
      fn.html = html2;
      fn.appendTo = function(selector) {
        return insertSelectors(arguments, this, true, false, true);
      };
      fn.wrapInner = function(selector) {
        return this.each(function(i, ele) {
          var $ele = cash4(ele);
          var contents = $ele.contents();
          contents.length ? contents.wrapAll(selector) : $ele.append(selector);
        });
      };
      fn.before = function() {
        return insertSelectors(arguments, this, false, true);
      };
      fn.wrapAll = function(selector) {
        var structure = cash4(selector);
        var wrapper = structure[0];
        while (wrapper.children.length)
          wrapper = wrapper.firstElementChild;
        this.first().before(structure);
        return this.appendTo(wrapper);
      };
      fn.wrap = function(selector) {
        return this.each(function(i, ele) {
          var wrapper = cash4(selector)[0];
          cash4(ele).wrapAll(!i ? wrapper : wrapper.cloneNode(true));
        });
      };
      fn.insertAfter = function(selector) {
        return insertSelectors(arguments, this, true, false, false, false, false, true);
      };
      fn.insertBefore = function(selector) {
        return insertSelectors(arguments, this, true, true);
      };
      fn.prepend = function() {
        return insertSelectors(arguments, this, false, true, true, true, true);
      };
      fn.prependTo = function(selector) {
        return insertSelectors(arguments, this, true, true, true, false, false, true);
      };
      fn.contents = function() {
        return cash4(unique(pluck(this, function(ele) {
          return ele.tagName === "IFRAME" ? [ele.contentDocument] : ele.tagName === "TEMPLATE" ? ele.content.childNodes : ele.childNodes;
        })));
      };
      fn.next = function(comparator, _all, _until) {
        return filtered(cash4(unique(pluck(this, "nextElementSibling", _all, _until))), comparator);
      };
      fn.nextAll = function(comparator) {
        return this.next(comparator, true);
      };
      fn.nextUntil = function(until, comparator) {
        return this.next(comparator, true, until);
      };
      fn.parents = function(comparator, _until) {
        return filtered(cash4(unique(pluck(this, "parentElement", true, _until))), comparator);
      };
      fn.parentsUntil = function(until, comparator) {
        return this.parents(comparator, until);
      };
      fn.prev = function(comparator, _all, _until) {
        return filtered(cash4(unique(pluck(this, "previousElementSibling", _all, _until))), comparator);
      };
      fn.prevAll = function(comparator) {
        return this.prev(comparator, true);
      };
      fn.prevUntil = function(until, comparator) {
        return this.prev(comparator, true, until);
      };
      fn.map = function(callback) {
        return cash4(concat.apply([], map.call(this, function(ele, i) {
          return callback.call(ele, i, ele);
        })));
      };
      fn.clone = function() {
        return this.map(function(i, ele) {
          return ele.cloneNode(true);
        });
      };
      fn.offsetParent = function() {
        return this.map(function(i, ele) {
          var offsetParent = ele.offsetParent;
          while (offsetParent && computeStyle(offsetParent, "position") === "static") {
            offsetParent = offsetParent.offsetParent;
          }
          return offsetParent || docEle;
        });
      };
      fn.slice = function(start, end) {
        return cash4(slice.call(this, start, end));
      };
      var dashAlphaRe = /-([a-z])/g;
      function camelCase(str) {
        return str.replace(dashAlphaRe, function(match, letter) {
          return letter.toUpperCase();
        });
      }
      fn.ready = function(callback) {
        var cb = function() {
          return setTimeout(callback, 0, cash4);
        };
        if (doc.readyState !== "loading") {
          cb();
        } else {
          doc.addEventListener("DOMContentLoaded", cb);
        }
        return this;
      };
      fn.unwrap = function() {
        this.parent().each(function(i, ele) {
          if (ele.tagName === "BODY")
            return;
          var $ele = cash4(ele);
          $ele.replaceWith($ele.children());
        });
        return this;
      };
      fn.offset = function() {
        var ele = this[0];
        if (!ele)
          return;
        var rect = ele.getBoundingClientRect();
        return {
          top: rect.top + win.pageYOffset,
          left: rect.left + win.pageXOffset
        };
      };
      fn.position = function() {
        var ele = this[0];
        if (!ele)
          return;
        var isFixed = computeStyle(ele, "position") === "fixed";
        var offset = isFixed ? ele.getBoundingClientRect() : this.offset();
        if (!isFixed) {
          var doc_1 = ele.ownerDocument;
          var offsetParent = ele.offsetParent || doc_1.documentElement;
          while ((offsetParent === doc_1.body || offsetParent === doc_1.documentElement) && computeStyle(offsetParent, "position") === "static") {
            offsetParent = offsetParent.parentNode;
          }
          if (offsetParent !== ele && isElement(offsetParent)) {
            var parentOffset = cash4(offsetParent).offset();
            offset.top -= parentOffset.top + computeStyleInt(offsetParent, "borderTopWidth");
            offset.left -= parentOffset.left + computeStyleInt(offsetParent, "borderLeftWidth");
          }
        }
        return {
          top: offset.top - computeStyleInt(ele, "marginTop"),
          left: offset.left - computeStyleInt(ele, "marginLeft")
        };
      };
      var propMap = {
        /* GENERAL */
        class: "className",
        contenteditable: "contentEditable",
        /* LABEL */
        for: "htmlFor",
        /* INPUT */
        readonly: "readOnly",
        maxlength: "maxLength",
        tabindex: "tabIndex",
        /* TABLE */
        colspan: "colSpan",
        rowspan: "rowSpan",
        /* IMAGE */
        usemap: "useMap"
      };
      fn.prop = function(prop, value) {
        if (!prop)
          return;
        if (isString(prop)) {
          prop = propMap[prop] || prop;
          if (arguments.length < 2)
            return this[0] && this[0][prop];
          return this.each(function(i, ele) {
            ele[prop] = value;
          });
        }
        for (var key in prop) {
          this.prop(key, prop[key]);
        }
        return this;
      };
      fn.removeProp = function(prop) {
        return this.each(function(i, ele) {
          delete ele[propMap[prop] || prop];
        });
      };
      var cssVariableRe = /^--/;
      function isCSSVariable(prop) {
        return cssVariableRe.test(prop);
      }
      var prefixedProps = {};
      var style = div.style;
      var vendorsPrefixes = ["webkit", "moz", "ms"];
      function getPrefixedProp(prop, isVariable) {
        if (isVariable === void 0) {
          isVariable = isCSSVariable(prop);
        }
        if (isVariable)
          return prop;
        if (!prefixedProps[prop]) {
          var propCC = camelCase(prop);
          var propUC = "".concat(propCC[0].toUpperCase()).concat(propCC.slice(1));
          var props = "".concat(propCC, " ").concat(vendorsPrefixes.join("".concat(propUC, " "))).concat(propUC).split(" ");
          each(props, function(i, p) {
            if (p in style) {
              prefixedProps[prop] = p;
              return false;
            }
          });
        }
        return prefixedProps[prop];
      }
      var numericProps = {
        animationIterationCount: true,
        columnCount: true,
        flexGrow: true,
        flexShrink: true,
        fontWeight: true,
        gridArea: true,
        gridColumn: true,
        gridColumnEnd: true,
        gridColumnStart: true,
        gridRow: true,
        gridRowEnd: true,
        gridRowStart: true,
        lineHeight: true,
        opacity: true,
        order: true,
        orphans: true,
        widows: true,
        zIndex: true
      };
      function getSuffixedValue(prop, value, isVariable) {
        if (isVariable === void 0) {
          isVariable = isCSSVariable(prop);
        }
        return !isVariable && !numericProps[prop] && isNumeric(value) ? "".concat(value, "px") : value;
      }
      function css3(prop, value) {
        if (isString(prop)) {
          var isVariable_1 = isCSSVariable(prop);
          prop = getPrefixedProp(prop, isVariable_1);
          if (arguments.length < 2)
            return this[0] && computeStyle(this[0], prop, isVariable_1);
          if (!prop)
            return this;
          value = getSuffixedValue(prop, value, isVariable_1);
          return this.each(function(i, ele) {
            if (!isElement(ele))
              return;
            if (isVariable_1) {
              ele.style.setProperty(prop, value);
            } else {
              ele.style[prop] = value;
            }
          });
        }
        for (var key in prop) {
          this.css(key, prop[key]);
        }
        return this;
      }
      ;
      fn.css = css3;
      function attempt(fn2, arg) {
        try {
          return fn2(arg);
        } catch (_a) {
          return arg;
        }
      }
      var JSONStringRe = /^\s+|\s+$/;
      function getData(ele, key) {
        var value = ele.dataset[key] || ele.dataset[camelCase(key)];
        if (JSONStringRe.test(value))
          return value;
        return attempt(JSON.parse, value);
      }
      function setData(ele, key, value) {
        value = attempt(JSON.stringify, value);
        ele.dataset[camelCase(key)] = value;
      }
      function data(name, value) {
        if (!name) {
          if (!this[0])
            return;
          var datas = {};
          for (var key in this[0].dataset) {
            datas[key] = getData(this[0], key);
          }
          return datas;
        }
        if (isString(name)) {
          if (arguments.length < 2)
            return this[0] && getData(this[0], name);
          if (isUndefined(value))
            return this;
          return this.each(function(i, ele) {
            setData(ele, name, value);
          });
        }
        for (var key in name) {
          this.data(key, name[key]);
        }
        return this;
      }
      fn.data = data;
      function getDocumentDimension(doc2, dimension) {
        var docEle2 = doc2.documentElement;
        return Math.max(doc2.body["scroll".concat(dimension)], docEle2["scroll".concat(dimension)], doc2.body["offset".concat(dimension)], docEle2["offset".concat(dimension)], docEle2["client".concat(dimension)]);
      }
      each([true, false], function(i, outer) {
        each(["Width", "Height"], function(i2, prop) {
          var name = "".concat(outer ? "outer" : "inner").concat(prop);
          fn[name] = function(includeMargins) {
            if (!this[0])
              return;
            if (isWindow(this[0]))
              return outer ? this[0]["inner".concat(prop)] : this[0].document.documentElement["client".concat(prop)];
            if (isDocument(this[0]))
              return getDocumentDimension(this[0], prop);
            return this[0]["".concat(outer ? "offset" : "client").concat(prop)] + (includeMargins && outer ? computeStyleInt(this[0], "margin".concat(i2 ? "Top" : "Left")) + computeStyleInt(this[0], "margin".concat(i2 ? "Bottom" : "Right")) : 0);
          };
        });
      });
      each(["Width", "Height"], function(index, prop) {
        var propLC = prop.toLowerCase();
        fn[propLC] = function(value) {
          if (!this[0])
            return isUndefined(value) ? void 0 : this;
          if (!arguments.length) {
            if (isWindow(this[0]))
              return this[0].document.documentElement["client".concat(prop)];
            if (isDocument(this[0]))
              return getDocumentDimension(this[0], prop);
            return this[0].getBoundingClientRect()[propLC] - getExtraSpace(this[0], !index);
          }
          var valueNumber = parseInt(value, 10);
          return this.each(function(i, ele) {
            if (!isElement(ele))
              return;
            var boxSizing = computeStyle(ele, "boxSizing");
            ele.style[propLC] = getSuffixedValue(propLC, valueNumber + (boxSizing === "border-box" ? getExtraSpace(ele, !index) : 0));
          });
        };
      });
      var displayProperty = "___cd";
      fn.toggle = function(force) {
        return this.each(function(i, ele) {
          if (!isElement(ele))
            return;
          var hidden = isHidden(ele);
          var show = isUndefined(force) ? hidden : force;
          if (show) {
            ele.style.display = ele[displayProperty] || "";
            if (isHidden(ele)) {
              ele.style.display = getDefaultDisplay(ele.tagName);
            }
          } else if (!hidden) {
            ele[displayProperty] = computeStyle(ele, "display");
            ele.style.display = "none";
          }
        });
      };
      fn.hide = function() {
        return this.toggle(false);
      };
      fn.show = function() {
        return this.toggle(true);
      };
      var eventsNamespace = "___ce";
      var eventsNamespacesSeparator = ".";
      var eventsFocus = { focus: "focusin", blur: "focusout" };
      var eventsHover = { mouseenter: "mouseover", mouseleave: "mouseout" };
      var eventsMouseRe = /^(mouse|pointer|contextmenu|drag|drop|click|dblclick)/i;
      function getEventNameBubbling(name) {
        return eventsHover[name] || eventsFocus[name] || name;
      }
      function parseEventName(eventName) {
        var parts = eventName.split(eventsNamespacesSeparator);
        return [parts[0], parts.slice(1).sort()];
      }
      fn.trigger = function(event, data2) {
        if (isString(event)) {
          var _a = parseEventName(event), nameOriginal = _a[0], namespaces = _a[1];
          var name_1 = getEventNameBubbling(nameOriginal);
          if (!name_1)
            return this;
          var type = eventsMouseRe.test(name_1) ? "MouseEvents" : "HTMLEvents";
          event = doc.createEvent(type);
          event.initEvent(name_1, true, true);
          event.namespace = namespaces.join(eventsNamespacesSeparator);
          event.___ot = nameOriginal;
        }
        event.___td = data2;
        var isEventFocus = event.___ot in eventsFocus;
        return this.each(function(i, ele) {
          if (isEventFocus && isFunction(ele[event.___ot])) {
            ele["___i".concat(event.type)] = true;
            ele[event.___ot]();
            ele["___i".concat(event.type)] = false;
          }
          ele.dispatchEvent(event);
        });
      };
      function getEventsCache(ele) {
        return ele[eventsNamespace] = ele[eventsNamespace] || {};
      }
      function addEvent(ele, name, namespaces, selector, callback) {
        var eventCache = getEventsCache(ele);
        eventCache[name] = eventCache[name] || [];
        eventCache[name].push([namespaces, selector, callback]);
        ele.addEventListener(name, callback);
      }
      function hasNamespaces(ns1, ns2) {
        return !ns2 || !some.call(ns2, function(ns) {
          return ns1.indexOf(ns) < 0;
        });
      }
      function removeEvent(ele, name, namespaces, selector, callback) {
        var cache = getEventsCache(ele);
        if (!name) {
          for (name in cache) {
            removeEvent(ele, name, namespaces, selector, callback);
          }
        } else if (cache[name]) {
          cache[name] = cache[name].filter(function(_a) {
            var ns = _a[0], sel = _a[1], cb = _a[2];
            if (callback && cb.guid !== callback.guid || !hasNamespaces(ns, namespaces) || selector && selector !== sel)
              return true;
            ele.removeEventListener(name, cb);
          });
        }
      }
      fn.off = function(eventFullName, selector, callback) {
        var _this = this;
        if (isUndefined(eventFullName)) {
          this.each(function(i, ele) {
            if (!isElement(ele) && !isDocument(ele) && !isWindow(ele))
              return;
            removeEvent(ele);
          });
        } else if (!isString(eventFullName)) {
          for (var key in eventFullName) {
            this.off(key, eventFullName[key]);
          }
        } else {
          if (isFunction(selector)) {
            callback = selector;
            selector = "";
          }
          each(getSplitValues(eventFullName), function(i, eventFullName2) {
            var _a = parseEventName(eventFullName2), nameOriginal = _a[0], namespaces = _a[1];
            var name = getEventNameBubbling(nameOriginal);
            _this.each(function(i2, ele) {
              if (!isElement(ele) && !isDocument(ele) && !isWindow(ele))
                return;
              removeEvent(ele, name, namespaces, selector, callback);
            });
          });
        }
        return this;
      };
      fn.remove = function(comparator) {
        filtered(this, comparator).detach().off();
        return this;
      };
      fn.replaceWith = function(selector) {
        return this.before(selector).remove();
      };
      fn.replaceAll = function(selector) {
        cash4(selector).replaceWith(this);
        return this;
      };
      function on(eventFullName, selector, data2, callback, _one) {
        var _this = this;
        if (!isString(eventFullName)) {
          for (var key in eventFullName) {
            this.on(key, selector, data2, eventFullName[key], _one);
          }
          return this;
        }
        if (!isString(selector)) {
          if (isUndefined(selector) || isNull(selector)) {
            selector = "";
          } else if (isUndefined(data2)) {
            data2 = selector;
            selector = "";
          } else {
            callback = data2;
            data2 = selector;
            selector = "";
          }
        }
        if (!isFunction(callback)) {
          callback = data2;
          data2 = void 0;
        }
        if (!callback)
          return this;
        each(getSplitValues(eventFullName), function(i, eventFullName2) {
          var _a = parseEventName(eventFullName2), nameOriginal = _a[0], namespaces = _a[1];
          var name = getEventNameBubbling(nameOriginal);
          var isEventHover = nameOriginal in eventsHover;
          var isEventFocus = nameOriginal in eventsFocus;
          if (!name)
            return;
          _this.each(function(i2, ele) {
            if (!isElement(ele) && !isDocument(ele) && !isWindow(ele))
              return;
            var finalCallback = function(event) {
              if (event.target["___i".concat(event.type)])
                return event.stopImmediatePropagation();
              if (event.namespace && !hasNamespaces(namespaces, event.namespace.split(eventsNamespacesSeparator)))
                return;
              if (!selector && (isEventFocus && (event.target !== ele || event.___ot === name) || isEventHover && event.relatedTarget && ele.contains(event.relatedTarget)))
                return;
              var thisArg = ele;
              if (selector) {
                var target = event.target;
                while (!matches(target, selector)) {
                  if (target === ele)
                    return;
                  target = target.parentNode;
                  if (!target)
                    return;
                }
                thisArg = target;
              }
              Object.defineProperty(event, "currentTarget", {
                configurable: true,
                get: function() {
                  return thisArg;
                }
              });
              Object.defineProperty(event, "delegateTarget", {
                configurable: true,
                get: function() {
                  return ele;
                }
              });
              Object.defineProperty(event, "data", {
                configurable: true,
                get: function() {
                  return data2;
                }
              });
              var returnValue = callback.call(thisArg, event, event.___td);
              if (_one) {
                removeEvent(ele, name, namespaces, selector, finalCallback);
              }
              if (returnValue === false) {
                event.preventDefault();
                event.stopPropagation();
              }
            };
            finalCallback.guid = callback.guid = callback.guid || cash4.guid++;
            addEvent(ele, name, namespaces, selector, finalCallback);
          });
        });
        return this;
      }
      fn.on = on;
      function one(eventFullName, selector, data2, callback) {
        return this.on(eventFullName, selector, data2, callback, true);
      }
      ;
      fn.one = one;
      var queryEncodeCRLFRe = /\r?\n/g;
      function queryEncode(prop, value) {
        return "&".concat(encodeURIComponent(prop), "=").concat(encodeURIComponent(value.replace(queryEncodeCRLFRe, "\r\n")));
      }
      var skippableRe = /file|reset|submit|button|image/i;
      var checkableRe = /radio|checkbox/i;
      fn.serialize = function() {
        var query = "";
        this.each(function(i, ele) {
          each(ele.elements || [ele], function(i2, ele2) {
            if (ele2.disabled || !ele2.name || ele2.tagName === "FIELDSET" || skippableRe.test(ele2.type) || checkableRe.test(ele2.type) && !ele2.checked)
              return;
            var value = getValue(ele2);
            if (!isUndefined(value)) {
              var values = isArray(value) ? value : [value];
              each(values, function(i3, value2) {
                query += queryEncode(ele2.name, value2);
              });
            }
          });
        });
        return query.slice(1);
      };
      if (typeof exports !== "undefined") {
        module.exports = cash4;
      } else {
        win["cash"] = win["$"] = cash4;
      }
    })();
  }
});

// src/satori/Loader.ts
var InspectablePromiseMake = function(promise) {
  var isPending = true;
  var isRejected = false;
  var isFulfilled = false;
  var result = promise.then(
    function(v) {
      isFulfilled = true;
      isPending = false;
      return v;
    },
    function(e) {
      isRejected = true;
      isPending = false;
      throw e;
    }
  );
  result.isFulfilled = function() {
    return isFulfilled;
  };
  result.isPending = function() {
    return isPending;
  };
  result.isRejected = function() {
    return isRejected;
  };
  return result;
};
function AddCSS(name, styles) {
  let styleElement = document.getElementById(name);
  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.id = name;
    document.head.appendChild(styleElement);
  }
  styleElement.innerHTML = styles;
}
function AddLess(name, lessStyles) {
  let styleElement = document.getElementById(name);
  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.id = name;
    document.head.appendChild(styleElement);
  }
  less.render(lessStyles).then((output) => {
    styleElement.innerHTML = output.css;
  }).catch((error) => {
    console.error("Failed to compile LESS:", error);
  });
}
var Loader = class {
  assetPromiseResolves;
  assetPromises;
  conf;
  filePromises;
  logger;
  multiFileDelimiter;
  stylesheets;
  constructor(logger) {
    this.assetPromises = {};
    this.assetPromiseResolves = {};
    this.filePromises = {};
    this.logger = logger;
    this.multiFileDelimiter = encodeURIComponent("\n#########BREAK#########");
    this.stylesheets = [];
  }
  assetKeyToUrl(key) {
    var segments = key.split(":");
    var assetType = segments[0];
    var assetId = segments[1];
    throw new Error("method not implemented");
  }
  pendingPromisesGet() {
    var pending = [];
    var unknown = [];
    for (var assetKey in this.assetPromises) {
      var promise = this.assetPromises[assetKey];
      if (promise.isPending) {
        if (promise.isPending()) {
          pending.push(assetKey);
        }
      } else unknown.push(assetKey);
    }
    return { pending, unknown };
  }
  async require(keys, goalCallback, progressCallback) {
    var assets = [];
    if (keys == void 0 || keys == null) return [];
    if (!Array.isArray(keys)) keys = [keys];
    if (keys.length == 0) return [];
    var promises = [];
    for (let i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (key instanceof Promise)
        promises.push(key);
      else
        promises.push(
          this.promiseAsset(key, goalCallback, progressCallback).then((asset) => {
            assets[i] = asset;
          })
        );
    }
    await Promise.all(promises).catch((err) => {
      console.log(`failed to require ${keys}`);
      console.log(err);
    });
    return assets;
  }
  transformAssetKey(key) {
    return key;
  }
};

// src/Loader.ts
var requestConfigDefault = {
  "headers": { "Content-Type": "application/json" },
  "responseType": "text"
};
var responseTransform = function(type, goalCallback, progressCallback) {
  return async (response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
    } else if (response.body === null) {
      throw new Error("Response body is null. This may be due to a CORS issue or the server not returning a body.");
    }
    const reader = response.body.getReader();
    const contentLengthStr = response.headers.get("Content-Length");
    var contentLength = parseInt(contentLengthStr);
    if (isNaN(contentLength)) contentLength = 0;
    goalCallback && goalCallback(contentLength);
    let receivedLength = 0;
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      chunks.push(value);
      receivedLength += value.length;
      progressCallback && progressCallback(value.length);
    }
    const chunksAll = new Uint8Array(receivedLength);
    let position = 0;
    for (const chunk of chunks) {
      chunksAll.set(chunk, position);
      position += chunk.length;
    }
    const result = new TextDecoder("utf-8").decode(chunksAll);
    if (type == "text" || type == "text/plain") {
      return result;
    } else if (type == "json" || type == "text/json") {
      return JSON.parse(result);
    } else {
      throw new Error("unknown response type " + type);
    }
  };
};
var Loader2 = class extends Loader {
  loadingAnim;
  mergedStylesheet;
  mergedStylesheets = "";
  themes;
  static getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"), results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return "";
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }
  constructor() {
    super(console);
    this.themes = {};
    this.loadingAnim = document.getElementById("loadingAnim");
  }
  promisePost(url, data, config = requestConfigDefault, goalCallback, progressCallback) {
    return new Promise((resolve, reject) => {
      fetch(url, {
        method: "POST",
        // *GET, POST, PUT, DELETE, etc.
        mode: "cors",
        // no-cors, *cors, same-origin
        cache: "no-cache",
        // *default, no-cache, reload, force-cache, only-if-cached
        credentials: "same-origin",
        // include, *same-origin, omit
        headers: config.headers,
        redirect: "follow",
        // manual, *follow, error
        referrerPolicy: "no-referrer",
        // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: JSON.stringify(data)
        // body data type must match "Content-Type" header
      }).then(responseTransform(config.responseType, goalCallback, progressCallback)).then((resolution) => resolve(resolution)).catch((error) => {
        if (error && error.response) reject(error.response);
        else reject(error);
      });
    });
  }
  promiseDelete(url, data, config = requestConfigDefault, goalCallback, progressCallback) {
    return new Promise((resolve, reject) => {
      var myConfig = Object.assign({}, config);
      myConfig.params = Object.assign({}, data);
      fetch(url, {
        method: "DELETE",
        // *GET, POST, PUT, DELETE, etc.
        mode: "cors",
        // no-cors, *cors, same-origin
        cache: "no-cache",
        // *default, no-cache, reload, force-cache, only-if-cached
        credentials: "same-origin",
        // include, *same-origin, omit
        headers: config.headers,
        redirect: "follow",
        // manual, *follow, error
        referrerPolicy: "no-referrer"
        // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      }).then(responseTransform(config.responseType, goalCallback, progressCallback)).then((value) => resolve(value)).catch((error) => {
        if (error && error.response) reject(error.response);
        else reject(error);
      });
    });
  }
  promiseGet(url, data, config = requestConfigDefault, goalCallback, progressCallback) {
    return new Promise((resolve, reject) => {
      var query = "";
      if (data)
        for (var key in data) {
          if (data[key] == void 0) continue;
          var arg = encodeURIComponent(data[key]);
          query += `${key}=${arg}&`;
        }
      return fetch(`${url}${query ? `?${query}` : ""}`, {
        method: "GET",
        // *GET, POST, PUT, DELETE, etc.
        mode: "cors",
        // no-cors, *cors, same-origin
        cache: "default",
        // *default, no-cache, reload, force-cache, only-if-cached
        credentials: "same-origin",
        // include, *same-origin, omit
        headers: config.headers,
        redirect: "follow",
        // manual, *follow, error
        referrerPolicy: "no-referrer"
        // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      }).then(responseTransform(config.responseType, goalCallback, progressCallback)).then((resolution) => resolve(resolution)).catch((error) => {
        if (error && error.response) reject(error.response);
        else reject(error);
      });
    });
  }
  promiseSleep(duration) {
    return new Promise((resolve, reject) => {
      setTimeout(resolve, duration);
    });
  }
  promiseAsset(key, goalCallback, progressCallback) {
    key = this.transformAssetKey(key);
    var inspectableAssetPromise = this.assetPromises[key];
    if (inspectableAssetPromise) return inspectableAssetPromise;
    var assetPromise;
    var filePromise;
    var url = this.assetKeyToUrl(key);
    var segments = key.split(":");
    var assetType = segments[0];
    var assetId = segments[1];
    if (assetType == "less") {
      filePromise = this.filePromises[url];
      if (!filePromise)
        filePromise = this.promiseGet(url, void 0, void 0, goalCallback, progressCallback).then((rawData) => {
          this.appendMergedStylesheet(rawData);
        });
      assetPromise = filePromise;
    } else if (assetType == "module") {
      if (this.conf.RUN_MODE == "prod") {
        filePromise = this.filePromises[url];
        if (!filePromise)
          filePromise = this.promiseGet(url, void 0, void 0, goalCallback, progressCallback).then((rawData) => {
            const dataUri = "data:text/javascript;charset=utf-8," + encodeURIComponent(rawData);
            return import(dataUri);
          });
        assetPromise = filePromise;
      } else {
        assetPromise = import(url);
      }
    } else if (assetType == "script-ext") {
      filePromise = this.filePromises[url];
      if (!filePromise)
        filePromise = this.promiseGet(url, void 0, void 0, goalCallback, progressCallback).then((rawData) => this.promiseLoadScript(rawData));
      assetPromise = filePromise;
    } else if (assetType == "script-tag") {
      assetPromise = this.assetPromises[key];
      if (!assetPromise) {
        assetPromise = new Promise((resolve, reject) => {
          var s = document.createElement("script");
          s.crossOrigin = "anonymous";
          s.src = url;
          s.type = "text/javascript";
          s.onload = resolve;
          s.onerror = reject;
          document.head.append(s);
        });
      }
    } else if (assetType == "script") {
      if (false) {
        assetPromise = new Promise((resolve, reject) => {
          var s = document.createElement("script");
          s.type = "text/javascript";
          s.src = url;
          s.onload = resolve;
          document.head.append(s);
        });
      } else {
        filePromise = this.filePromises[url];
        if (!filePromise) {
          filePromise = this.promiseGet(url, void 0, void 0, goalCallback, progressCallback).then((rawData) => {
            var files = rawData.split(/#########BREAK#########/g);
            files.forEach((file) => this.promiseLoadScript(file));
          });
        }
        assetPromise = filePromise;
      }
    } else if (assetType == "css") {
      assetPromise = this.promiseGet(url, void 0, void 0, goalCallback, progressCallback).then((rawData) => {
        AddLess(url, rawData);
        return rawData;
      });
    } else if (assetType == "template") {
      filePromise = this.filePromises[url];
      if (!filePromise) {
        filePromise = this.promiseGet(url, void 0, void 0, goalCallback, progressCallback).then((rawData) => {
          var foundAssets = {};
          if (url.endsWith("_Mod.html")) {
            var regex = /###TEMPLATESTART###(.+?)###TEMPLATESTART###((.|\n)+?)###TEMPLATEEND######TEMPLATEEND###/g;
            var match;
            while ((match = regex.exec(rawData)) !== null) {
              foundAssets[`template:${match[1]}`] = match[2];
            }
          } else {
            foundAssets[key] = rawData;
          }
          return foundAssets;
        });
      }
      assetPromise = filePromise.then((foundAssets) => {
        return foundAssets[key];
      });
    } else if (assetType == "font") {
      var [family, style, weight, local] = assetId.split("|");
      var rule = `font-family: ${family}; font-style: ${style}; font-weight: ${weight}; src: local('${local}'), url('${url}') format('truetype');`;
      var styleElement = document.createElement("style");
      styleElement.setAttribute("rel", "stylesheet");
      styleElement.title = "dynamicSheet";
      styleElement.setAttribute("title", "dynamicSheet");
      styleElement.innerHTML = styleElement.innerHTML + "@font-face {" + rule + "}";
      document.head.appendChild(styleElement);
      var preload = document.createElement("link");
      preload.rel = "preload";
      preload.href = url;
      preload.type = "font/truetype";
      preload.as = "font";
      preload.crossOrigin = "anonymous";
      document.head.appendChild(styleElement);
      assetPromise = Promise.resolve();
    } else {
      throw new Error('no handler found to load asset "' + key + '"');
    }
    assetPromise = assetPromise.catch(function(err) {
      console.error(`error loading ${key}`);
      console.error(err);
    });
    if (assetPromise)
      this.assetPromises[key] = InspectablePromiseMake(assetPromise);
    if (filePromise)
      this.filePromises[url] = InspectablePromiseMake(filePromise);
    return assetPromise;
  }
  promiseLoadScript(file) {
    var isModule = file.match(/\/\/ MODULE\n/);
    var sourceUrlMatch = file.match(/sourceURL=(\S+)/);
    var s = document.createElement("script");
    if (isModule) {
      s.text = `${file.slice(10)}
`;
      s.setAttribute("type", "module");
      s.crossOrigin = "anonymous";
      if (sourceUrlMatch) {
        console.log(sourceUrlMatch[1]);
        s.setAttribute("src", sourceUrlMatch[1]);
      }
    } else {
      s.crossOrigin = "anonymous";
      s.text = file;
      s.type = "text/javascript";
      if (sourceUrlMatch) {
        console.log(sourceUrlMatch[1]);
        s.setAttribute("file", sourceUrlMatch[1]);
      }
    }
    document.head.append(s);
  }
  appendMergedStylesheet(rawData) {
    var files = rawData.split("/** THIS IS A CSS BREAK **/");
    for (var file of files) {
      var filenameMatch = file.match(/\* FILE:(\S+?) \*/);
      var style = document.createElement("style");
      style.setAttribute("type", "text/css");
      if (filenameMatch) style.setAttribute("file", filenameMatch[1]);
      style.appendChild(document.createTextNode(file));
      document.head.append(style);
      this.stylesheets.push(style);
    }
  }
  // async themePlayByStoreUUID(
  //   storeUUID: string,
  //   useCache: boolean = true,
  //   reload: boolean = false,
  //   goalCallback?: (bytes: number) => void,
  //   progressCallback?: (bytes: number) => void
  // ): Promise<boolean> {
  //   if (!useCache) {
  //     delete this.themes[storeUUID]
  //     this.themeStoreUUID = null
  //   }
  //   if (this.themeStoreUUID == storeUUID && !reload) return
  //   this.themeStoreUUID = storeUUID
  //   // Get theme
  //   var theme = this.themes[storeUUID]
  //   if (!theme) {
  //     await this.promisePost<object>(
  //       `${this.conf.API_SERVER_BASEURL_EXT}/themeGet`,
  //       { storeUUID },
  //       { headers: { 'Content-Type': 'application/json' }, responseType: 'json' },
  //       goalCallback,
  //       progressCallback,
  //     ).then((response: ThemeGetResponse) => {
  //       theme = response.data.docs.toReturn[0]
  //     })
  //   }
  //   if (!this.mergedStylesheets) {
  //     await this.promiseGet<string>(
  //       `/less?v=${theme.version}&mod=base`,
  //       undefined,
  //       undefined,
  //       goalCallback,
  //       progressCallback
  //     ).then(stylesheet => { this.mergedStylesheets = stylesheet })
  //   }
  //   // Start the switch
  //   this.themes[storeUUID] = theme
  //   this.conf.THEME = theme
  //   // Switch the background
  //   if (this.conf.THEME.thmBgImage)
  //     document.documentElement.style.backgroundImage = `url('${this.assetKeyToUrl(`image:${this.conf.THEME.thmBgImage}`)}')`
  //   else
  //     document.documentElement.style.backgroundColor = this.conf.THEME.thmBgClr
  //   // Save oldStylesheets
  //   var oldStylesheets = this.stylesheets
  //   this.stylesheets = []
  //   // Substitute with theme values
  //   var substitutions = {
  //     ASSET_SERVER_CDN_BASEURL: this.conf['ASSET_SERVER_CDN_BASEURL']
  //   }
  //   for (var key in theme) {
  //     if (!key.startsWith('thm')) continue
  //     if (key.includes('Clr') ||
  //       key.includes('Color') ||
  //       key.includes('Img') ||
  //       key.includes('Image') ||
  //       key.includes('Logo') ||
  //       key.includes('Icon')) {
  //       substitutions[key] = theme[key]
  //     }
  //   }
  //   // for (var key in theme.color) substitutions[`\#${key}`] = theme.color[key]
  //   // for (var key in theme.img) substitutions[key] = theme.img[key]
  //   function replaceAll(str, mapObj) {
  //     var re = new RegExp(Object.keys(mapObj).join('|'), 'gi')
  //     return str.replace(re, function (matched) {
  //       return mapObj[matched]
  //     })
  //   }
  //   var mergedStylesheetsWithSubs = replaceAll(this.mergedStylesheets, substitutions)
  //   // Swap stylesheets
  //   this.appendMergedStylesheet(mergedStylesheetsWithSubs)
  //   oldStylesheets.forEach(ss => ss.remove())
  // }
  transformAssetKey(key) {
    return key.replace("com.gt.merch.", "").replace("com.gt.zowie.", "");
  }
  assetKeyToUrl(key) {
    var segments = key.split(":");
    var assetType = segments[0];
    var assetId = segments[1];
    if (assetType == "script-ext" || assetType == "script-tag") {
      return segments.slice(1).join(":");
    }
    if (assetType == "script") {
      return `${this.conf.ASSET_SERVER_CDN_BASEURL}${this.conf.APP_URL_PATH_BASE}/code?v=${this.conf.VERSION}&mod=boot&delimiter=${this.multiFileDelimiter}${this.conf.COMPILE ? "&compile=true" : ""}`;
    }
    if (assetType == "module") {
      return segments.slice(1).join(":");
    }
    if (assetType == "less") {
      return `${this.conf.ASSET_SERVER_CDN_BASEURL}${this.conf.APP_URL_PATH_BASE}/less?v=${this.conf.THEME.version}&storeUUID=${this.conf.THEME.storeUUID}&mod=base`;
    }
    if (assetType == "template") {
      var assetPath = assetId.replace(/\./g, "/") + ".html";
      return `${this.conf.ASSET_SERVER_CDN_BASEURL}${this.conf.APP_URL_PATH_BASE}/${assetPath}?v=${this.conf.VERSION}`;
    }
    if (assetType == "css") {
      var assetPath = assetId.replace(/\./g, "/");
      return assetPath + ".css";
    }
    if (assetType == "font") {
      var [family, style, weight, local, ttfFile] = assetId.split("|");
      return `${this.conf.ASSET_SERVER_CDN_BASEURL}${this.conf.APP_URL_PATH_BASE}/font/${ttfFile}?v=${this.conf.VERSION}`;
    }
    if (assetType == "image") {
      var subSegments = assetId.split("|");
      var path = subSegments[0];
      var maxW = subSegments[1];
      var maxH = subSegments[2];
      let maxWNum, maxHNum;
      if (maxW) {
        if (maxW.indexOf("%") > -1) {
          var w = window.innerWidth;
          maxWNum = parseInt(maxW.substring(0, maxW.length - 1)) / 100 * (w - w % 100) + 100;
        } else
          maxWNum = parseInt(maxW);
      } else
        maxWNum = Number.MAX_SAFE_INTEGER;
      if (maxH) {
        if (maxH && maxH.indexOf("%") > -1) {
          var h = window.innerHeight;
          maxHNum = parseInt(maxH.substring(0, maxH.length - 1)) / 100 * (h - h % 100) + 100;
        } else
          maxHNum = parseInt(maxH);
      } else
        maxHNum = Number.MAX_SAFE_INTEGER;
      return `${this.conf.IMAGE_SERVER_URL}?src=${encodeURIComponent(path)}&maxW=${maxW}&maxH=${maxH}`;
    }
    return key;
  }
  getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(";");
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) === " ") {
        c = c.substring(1, c.length);
      }
      if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length, c.length);
      }
    }
    return null;
  }
  cookie(key, value, attributes) {
    throw "Loader.cookie: unexpected call";
    var result;
    if (typeof document === "undefined") {
      return;
    }
    if (arguments.length > 1) {
      attributes = Object.assign({ path: "/" }, attributes);
      if (typeof attributes.expires === "number") {
        var expires = /* @__PURE__ */ new Date();
        expires.setMilliseconds(
          expires.getMilliseconds() + attributes.expires * 864e5
        );
        attributes.expires = expires;
      }
      attributes.expires = attributes.expires ? attributes.expires.toUTCString() : "";
      value = JSON.stringify(value);
      key = encodeURIComponent(String(key));
      var stringifiedAttributes = "";
      for (var attributeName in attributes) {
        if (!attributes[attributeName]) {
          continue;
        }
        stringifiedAttributes += "; " + attributeName;
        if (attributes[attributeName] === true) {
          continue;
        }
        stringifiedAttributes += "=" + attributes[attributeName];
      }
      return document.cookie = key + "=" + value + stringifiedAttributes;
    }
    if (!key) {
      result = {};
    }
    var cookies = document.cookie ? document.cookie.split("; ") : [];
    var rdecode = /(%[0-9A-Z]{2})+/g;
    var i = 0;
    for (; i < cookies.length; i++) {
      var parts = cookies[i].split("=");
      var cookie = parts.slice(1).join("=");
      var name = parts[0].replace(rdecode, decodeURIComponent);
      cookie = cookie.replace(rdecode, decodeURIComponent);
      cookie = JSON.parse(cookie);
      if (key === name) {
        result = cookie;
        break;
      }
      if (!key) {
        result[name] = cookie;
      }
    }
    return result;
  }
  loadingAnimPlay() {
    if (this.loadingAnim === null) return;
    this.loadingAnim.className = "pulse";
  }
  loadingAnimStop() {
    if (this.loadingAnim === null) return;
    this.loadingAnim.className = "hide";
  }
};
var LoadingBar = class {
  catchUpIntervalMs = 2500;
  element;
  loadGoalBytes = 0;
  loadProgressBytes = 0;
  loadProgressBytesToShow = 0;
  loadProgressDelta = 0;
  opacityCycleMs = 2200;
  opacityStop = 0.33;
  playing = false;
  startTimeMs = 0;
  stepIntervalMs = 15;
  stepTimeMs = 0;
  stepWrapper;
  constructor(element) {
    this.element = element;
    this.stepWrapper = (timestamp) => this.step(timestamp);
  }
  play() {
    if (this.playing) return this;
    this.playing = true;
    this.startTimeMs = Date.now();
    window.requestAnimationFrame(this.stepWrapper);
    return this;
  }
  step(timestamp) {
    if (!this.playing) return;
    if (timestamp - this.stepTimeMs < this.stepIntervalMs)
      return window.requestAnimationFrame(this.stepWrapper);
    this.stepTimeMs = timestamp;
    if (this.loadProgressBytesToShow < this.loadProgressBytes) {
      this.loadProgressBytesToShow += this.loadProgressDelta;
      var pctComplete = 0.1 + 0.9 * this.loadProgressBytesToShow / this.loadGoalBytes;
      this.element.style.width = pctComplete * 100 + "%";
    }
    var timeDeltaMs = Date.now() - this.startTimeMs;
    if (timeDeltaMs > 12e4) {
      console.log("Loading Bar timed out");
      this.stop();
    }
    var radiansElapsed = 6.28319 * timeDeltaMs / this.opacityCycleMs;
    var opacity = 1 - (1 - this.opacityStop) * Math.sin(radiansElapsed);
    this.element.style.opacity = opacity;
    window.requestAnimationFrame(this.stepWrapper);
  }
  reset(loadGoalBytes) {
    this.opacityStop = 0.33;
    this.opacityCycleMs = 2200;
    this.catchUpIntervalMs = 2500;
    this.loadGoalBytes = loadGoalBytes;
    this.loadProgressBytes = 0;
    this.loadProgressBytesToShow = 0;
    this.loadProgressDelta = 0;
    this.stepIntervalMs = 15;
    this.playing = false;
    this.stepTimeMs = 0;
    return this;
  }
  stop() {
    if (!this.playing) return;
    this.playing = false;
    console.log(`LoadingBar loaded ${this.loadProgressBytes} on stop`);
    this.element.style.display = "none";
  }
  goalAdd(bytes) {
    this.loadGoalBytes += bytes;
  }
  progressAdd(bytes) {
    this.loadProgressBytes += bytes;
    this.loadProgressDelta = (this.loadProgressBytes - this.loadProgressBytesToShow) / this.catchUpIntervalMs * this.stepIntervalMs;
  }
};

// src/ErrorHandler.ts
var handleError = async (error) => {
  if (window.app) {
    if (error && error.data && error.data.code == "too.many.requests") {
      window.app.alert(
        `<div class="h1">Request Rate Limited</div><div class='body'>Are you a robot?</div>`,
        "OK"
      );
      return true;
    }
    if (error && error.code == "invalid.auth.token") {
      window.app.alert(
        `<div class="h1">Invalid Auth Tokens</div><div class='body'>Your authentication tokens are no longer valid.<br/><br/>
                        You may continue, but you must authenticate again to place an order.</div>`,
        "OK"
      ).then(() => {
        window.app.stor.clear();
        window.location.reload();
      });
      return true;
    }
    if (error.message == "Network Error") {
      window.app.alert(
        `<div class="h1">Network Error</div><div class='body'>The network seems to be temporarily unavailable.</div>`,
        "OK"
      );
      return true;
    }
  }
  return false;
};
window.handleError = handleError;
window.onerror = async (...args) => {
  var error = args.length ? args[0] : void 0;
  if (error && await handleError(error)) return;
  try {
    window.errorScreenPlay(error);
  } catch (err) {
    alert("Error while playing error screen. See console for root cause.");
    console.log(err);
  }
};
window.addEventListener("unhandledrejection", async function(event) {
  var error = event.reason;
  if (error && !!window.app && await handleError(error)) {
    event.preventDefault();
    event.stopPropagation();
    event.cancelBubble = true;
    return;
  }
  try {
    window.errorScreenPlay(error);
  } catch (err) {
    alert("Error while playing error screen. See console for root cause.");
    console.log(err);
  }
});

// src/DAO.ts
var creations = {
  "paloma": {
    id: "paloma",
    heroImg: "assets/paloma-fresca/hero.png",
    title: "Paloma Fresca",
    desc: "A fresh citrus-forward coastal mocktail inspired by long afternoons on the Malibu pier.",
    bom: [
      { title: "4 oz fresh grapefruit juice", link: "" },
      { title: "1 oz lime juice", link: "" },
      { title: "2 oz sparkling water", link: "" },
      { title: "1 tsp agave syrup", link: "" },
      { title: "Sea-salt rim", link: "" },
      { title: "Rosemary sprig or grapefruit wedge (garnish)", link: "" }
    ],
    tags: [
      "grapefruit",
      "rosemary"
    ],
    time: "10 min",
    steps: [
      "Run a lime wedge around the rim and dip the glass in sea salt.",
      "Fill the glass with ice.",
      "Add grapefruit juice, lime juice, and agave syrup.",
      "Stir gently to combine.",
      "Top with sparkling water.",
      "Garnish with rosemary sprig or grapefruit slice."
    ],
    notes: "Use pink grapefruit for a softer, sweeter profile. Swap sparkling water for tonic if you like more bite, or try smoked sea salt on the rim for an extra coastal twist."
  },
  "strawberry-basil-lemonade": {
    id: "strawberry-basil-lemonade",
    heroImg: "assets/strawberry-basil/hero.png",
    title: "Strawberry Basil Lemonade",
    desc: "A refreshing blend of sweet strawberries, fresh basil, and tangy lemon.",
    bom: [
      { title: "6 fresh strawberries, hulled", link: "" },
      { title: "6-8 fresh basil leaves", link: "" },
      { title: "2 oz fresh lemon juice", link: "" },
      { title: "1 oz simple syrup", link: "" },
      { title: "3 oz sparkling water", link: "" },
      { title: "Basil sprig and strawberry slice (garnish)", link: "" }
    ],
    tags: ["strawberry", "basil", "lemon"],
    time: "5 min",
    steps: [
      "Muddle strawberries and basil leaves in a shaker.",
      "Add lemon juice and simple syrup.",
      "Fill with ice and shake vigorously for 15 seconds.",
      "Strain into a glass filled with fresh ice.",
      "Top with sparkling water.",
      "Garnish with basil sprig and strawberry slice."
    ],
    notes: "For a sweeter version, add an extra 1/2 oz simple syrup. The basil adds a sophisticated herbal note."
  },
  "cucumber-mint-cooler": {
    id: "cucumber-mint-cooler",
    heroImg: "assets/cucumber-mint/hero.png",
    title: "Cucumber Mint Cooler",
    desc: "A light and hydrating drink perfect for hot summer days with cooling cucumber and mint.",
    bom: [
      { title: "4-5 cucumber slices", link: "" },
      { title: "10 fresh mint leaves", link: "" },
      { title: "1 oz lime juice", link: "" },
      { title: "3/4 oz honey syrup", link: "" },
      { title: "2 oz tonic water", link: "" },
      { title: "Cucumber ribbon and mint sprig (garnish)", link: "" }
    ],
    tags: ["cucumber", "mint"],
    time: "5 min",
    steps: [
      "Muddle cucumber slices and mint leaves gently.",
      "Add lime juice and honey syrup.",
      "Fill glass with crushed ice.",
      "Stir to combine.",
      "Top with tonic water.",
      "Garnish with cucumber ribbon and mint sprig."
    ],
    notes: "Use English cucumber for less bitterness. Honey syrup can be made by mixing equal parts honey and warm water."
  },
  "hibiscus-ginger-fizz": {
    id: "hibiscus-ginger-fizz",
    heroImg: "assets/hibiscus-ginger/hero.png",
    title: "Hibiscus Ginger Fizz",
    desc: "A vibrant ruby-red mocktail with floral hibiscus and spicy ginger notes.",
    bom: [
      { title: "2 oz hibiscus tea, chilled", link: "" },
      { title: "1 oz fresh ginger syrup", link: "" },
      { title: "1/2 oz lime juice", link: "" },
      { title: "3 oz ginger beer", link: "" },
      { title: "Dried hibiscus flower (garnish)", link: "" }
    ],
    tags: ["hibiscus", "ginger"],
    time: "5 min",
    steps: [
      "Brew hibiscus tea and chill completely.",
      "Add hibiscus tea, ginger syrup, and lime juice to glass.",
      "Fill with ice.",
      "Top with ginger beer.",
      "Stir gently.",
      "Garnish with dried hibiscus flower."
    ],
    notes: "Make ginger syrup by simmering equal parts sugar, water, and sliced ginger for 10 minutes. Adjust sweetness to taste."
  },
  "pineapple-coconut-crush": {
    id: "pineapple-coconut-crush",
    heroImg: "assets/pineapple-coconut/hero.png",
    title: "Pineapple Coconut Crush",
    desc: "A tropical paradise in a glass with sweet pineapple and creamy coconut.",
    bom: [
      { title: "3 oz fresh pineapple juice", link: "" },
      { title: "2 oz coconut cream", link: "" },
      { title: "1 oz lime juice", link: "" },
      { title: "1/2 oz vanilla syrup", link: "" },
      { title: "Pineapple wedge and toasted coconut (garnish)", link: "" }
    ],
    tags: ["pineapple", "coconut"],
    time: "5 min",
    steps: [
      "Add all ingredients to a blender with 1 cup ice.",
      "Blend until smooth and frothy.",
      "Pour into a hurricane or tiki glass.",
      "Garnish with pineapple wedge and toasted coconut.",
      "Serve immediately."
    ],
    notes: "For a lighter version, use coconut milk instead of coconut cream. Freezing pineapple chunks makes it extra refreshing."
  },
  "watermelon-mint-agua-fresca": {
    id: "watermelon-mint-agua-fresca",
    heroImg: "assets/watermelon-mint/hero.png",
    title: "Watermelon Mint Agua Fresca",
    desc: "A refreshing Mexican-inspired drink with sweet watermelon and cooling mint.",
    bom: [
      { title: "2 cups fresh watermelon chunks", link: "" },
      { title: "8-10 fresh mint leaves", link: "" },
      { title: "1 oz lime juice", link: "" },
      { title: "1/2 oz agave nectar", link: "" },
      { title: "2 oz sparkling water", link: "" },
      { title: "Watermelon wedge and mint leaf (garnish)", link: "" }
    ],
    tags: ["watermelon", "mint"],
    time: "10 min",
    steps: [
      "Blend watermelon chunks until smooth.",
      "Strain through fine mesh to remove pulp.",
      "Muddle mint leaves in glass.",
      "Add watermelon juice, lime juice, and agave.",
      "Fill with ice and top with sparkling water.",
      "Garnish with watermelon wedge and mint leaf."
    ],
    notes: "This drink is naturally sweet, so adjust agave to taste. Best served very cold on hot days."
  },
  "lavender-lemon-spritz": {
    id: "lavender-lemon-spritz",
    heroImg: "assets/lavender-lemon/hero.png",
    title: "Lavender Lemon Spritz",
    desc: "An elegant and aromatic mocktail with floral lavender and bright lemon.",
    bom: [
      { title: "1 oz lavender syrup", link: "" },
      { title: "1 oz fresh lemon juice", link: "" },
      { title: "4 oz prosecco-style sparkling water", link: "" },
      { title: "Lemon twist and lavender sprig (garnish)", link: "" }
    ],
    tags: ["lavender", "lemon"],
    time: "3 min",
    steps: [
      "Add lavender syrup and lemon juice to a champagne flute.",
      "Top with chilled sparkling water.",
      "Stir gently.",
      "Garnish with lemon twist and lavender sprig.",
      "Serve immediately."
    ],
    notes: "Make lavender syrup by steeping 2 tbsp dried lavender in 1 cup simple syrup for 15 minutes. Don't over-steep or it becomes soapy."
  },
  "spiced-apple-cider-mocktail": {
    id: "spiced-apple-cider-mocktail",
    heroImg: "assets/spiced-apple/hero.png",
    title: "Spiced Apple Cider Mocktail",
    desc: "A warm and cozy autumn drink with apple cider, cinnamon, and spices.",
    bom: [
      { title: "4 oz fresh apple cider", link: "" },
      { title: "1 cinnamon stick", link: "" },
      { title: "2 whole cloves", link: "" },
      { title: "1 star anise", link: "" },
      { title: "1/2 oz maple syrup", link: "" },
      { title: "Orange slice and cinnamon stick (garnish)", link: "" }
    ],
    tags: ["apple", "cinnamon", "autumn"],
    time: "15 min",
    steps: [
      "Warm apple cider in a small pot with spices.",
      "Simmer gently for 10 minutes.",
      "Strain into a heat-safe mug.",
      "Stir in maple syrup.",
      "Garnish with orange slice and cinnamon stick.",
      "Serve warm."
    ],
    notes: "Can be served cold over ice in summer. Add a dash of vanilla extract for extra warmth. Makes your kitchen smell amazing!"
  },
  "blood-orange-thyme-sparkler": {
    id: "blood-orange-thyme-sparkler",
    heroImg: "assets/blood-orange/hero.png",
    title: "Blood Orange Thyme Sparkler",
    desc: "A sophisticated mocktail with vibrant blood orange and earthy thyme.",
    bom: [
      { title: "3 oz fresh blood orange juice", link: "" },
      { title: "3-4 fresh thyme sprigs", link: "" },
      { title: "1/2 oz honey syrup", link: "" },
      { title: "2 oz sparkling water", link: "" },
      { title: "Blood orange wheel and thyme sprig (garnish)", link: "" }
    ],
    tags: ["blood orange", "thyme"],
    time: "5 min",
    steps: [
      "Gently muddle 2 thyme sprigs with honey syrup.",
      "Add blood orange juice and ice.",
      "Shake well for 10 seconds.",
      "Strain into a coupe glass.",
      "Top with sparkling water.",
      "Garnish with blood orange wheel and thyme sprig."
    ],
    notes: "Blood orange season is winter through spring. Regular oranges work but lack the stunning ruby color."
  },
  "mango-chili-lime-mocktail": {
    id: "mango-chili-lime-mocktail",
    heroImg: "assets/mango-chili/hero.png",
    title: "Mango Chili Lime Mocktail",
    desc: "A bold and spicy tropical drink with sweet mango, tangy lime, and a chili kick.",
    bom: [
      { title: "3 oz fresh mango puree", link: "" },
      { title: "1 oz lime juice", link: "" },
      { title: "1/2 oz agave syrup", link: "" },
      { title: "Pinch of chili powder", link: "" },
      { title: "2 oz sparkling water", link: "" },
      { title: "Taj\xEDn rim, mango slice, and lime wheel (garnish)", link: "" }
    ],
    tags: ["mango", "chili", "lime"],
    time: "7 min",
    steps: [
      "Rim glass with lime juice and dip in Taj\xEDn seasoning.",
      "Blend mango puree, lime juice, agave, and chili powder.",
      "Pour into prepared glass over ice.",
      "Top with sparkling water.",
      "Garnish with mango slice and lime wheel.",
      "Serve immediately."
    ],
    notes: "Adjust chili to your heat preference. For a smoky version, use chipotle powder instead of chili powder."
  },
  "blueberry-sage-smash": {
    id: "blueberry-sage-smash",
    heroImg: "assets/blueberry-sage/hero.png",
    title: "Blueberry Sage Smash",
    desc: "A beautiful purple mocktail with antioxidant-rich blueberries and aromatic sage.",
    bom: [
      { title: "1/2 cup fresh blueberries", link: "" },
      { title: "4-5 fresh sage leaves", link: "" },
      { title: "1 oz lemon juice", link: "" },
      { title: "3/4 oz simple syrup", link: "" },
      { title: "2 oz club soda", link: "" },
      { title: "Blueberries and sage leaf (garnish)", link: "" }
    ],
    tags: ["blueberry", "sage"],
    time: "5 min",
    steps: [
      "Muddle blueberries and sage leaves in a shaker.",
      "Add lemon juice and simple syrup.",
      "Fill with ice and shake vigorously.",
      "Double strain into a rocks glass with fresh ice.",
      "Top with club soda.",
      "Garnish with fresh blueberries and sage leaf."
    ],
    notes: "The double strain removes seeds and herb bits for a cleaner drink. Sage pairs surprisingly well with berries."
  }
};
var DAO = class {
  async CreationGetByID(id) {
    return creations[id];
  }
  async CreationsGet(pageSize, pageNum) {
    const allCreations = Object.values(creations);
    const start = pageNum * pageSize;
    const end = start + pageSize;
    return allCreations.slice(start, end);
  }
  async UserGetOrCreate(args) {
    return {
      id: args.userID,
      email: args.createParams.email,
      nameFamily: args.createParams.nameFamily,
      nameGiven: args.createParams.nameGiven,
      nameAlias: args.createParams.nameAlias,
      nameNick: args.createParams.nameNick,
      gender: args.createParams.gender,
      createdAt: args.createParams.createdAt,
      lastLogin: args.createParams.lastLogin,
      role: args.createParams.role
    };
  }
};
var dao = new DAO();

// src/satori/Donut.ts
var donutId = 0;
function html(strings, ...args) {
  var out = "";
  strings.forEach((s, i) => {
    out += s;
    if (i < args.length) out += args[i];
  });
  return out;
}
function css(strings, ...args) {
  var out = "";
  strings.forEach((s, i) => {
    out += s;
    if (i < args.length) out += args[i];
  });
  return out;
}
var Donut = class {
  selector;
  a;
  api;
  app;
  dobs;
  donutFactory;
  donutId;
  loader;
  scrollTop = 0;
  signals;
  stopping = false;
  constructor(selector) {
    this.selector = selector;
    this.donutId = donutId++;
    this.a = {};
  }
  // public static first(arr) {
  //   return arr[0]
  // }
  // public static optionAttr(options: DonutOptions, optionAttrKey: string, optionAttrDefault: string) {
  //   var optionAttrValue: string
  //   var optionAttrAttr = (options && options.attrs && options.attrs.getNamedItem(optionAttrKey))
  //   if (optionAttrAttr) {
  //     optionAttrValue = optionAttrAttr.value
  //     options.attrs?.removeNamedItem(optionAttrKey)
  //   }
  //   return optionAttrValue || (options && options[optionAttrKey]) || optionAttrDefault
  // }
  attr(name, value) {
    this.dobs.attr(name, value);
  }
  // creates fake attrs
  attrsMake(attrs) {
    return {
      getNamedItem(k) {
        return attrs[k];
      },
      removeNamedItem(k) {
        delete attrs[k];
      }
    };
  }
  config(config) {
    Object.assign(this, config);
  }
  css(k, v) {
    this.dobs.css(k, v);
  }
  dinkInit(id, dinkDob, controlledDob, closed, callback) {
    var fn = () => this.dinkPlay(id, dinkDob, controlledDob, true, void 0, callback);
    dinkDob.on("click touch", fn);
    this.dinkPlay(id, dinkDob, controlledDob, false, closed, callback);
  }
  dinkIsClosed(id) {
    var storageId = `donut_${this.donutId}:dink_${id}`;
    return this.app.stor.get(storageId);
  }
  dinkPlay(id, dinkDob, controlledDob, toggle = true, closed, callback) {
    var storageId = `${id}.Dink`;
    var closed = closed !== null ? closed : this.app.stor.get(storageId);
    if (toggle) closed = !closed;
    if (closed) {
      dinkDob.addClass("closed");
      dinkDob.removeClass("open");
      controlledDob.hide();
    } else {
      dinkDob.addClass("open");
      dinkDob.removeClass("closed");
      controlledDob.show();
    }
    this.app.stor.put(storageId, closed);
    return callback ? callback() : Promise.resolve();
  }
  // public elemFirst(arr) {
  //   return arr[0]
  // }
  async evtStop(e) {
    if (!e) return;
    e.stopPropagation();
    e.preventDefault();
  }
  hide() {
    this.dobs.hide();
    return this;
  }
  hideIf(cond) {
    if (cond)
      this.dobs.hide();
    else
      this.dobs.show();
    return this;
  }
  html(html2) {
    this.dobs.html(html2);
  }
  // Lifecycle Methods
  init(template, properties, options) {
    if (template === void 0 || typeof template != "string")
      throw new Error("Cannot call base Donut.Init with an undefined template");
    this.dobs = this.donutFactory.dobsMakeFromTemplate(template.trim());
    if (options && options.attrs) {
      for (var i = 0; i < options.attrs.length; i++) {
        var attr = options.attrs[i];
        if (attr.name == "class") {
          this.dobs.addClass(attr.value);
        } else {
          this.dobs.attr(attr.name, attr.value);
        }
      }
      delete options.attrs;
    }
    for (var prop in properties) {
      var spec = properties[prop];
      if (!Array.isArray(spec)) {
        var elem = this.dobs.find(spec);
        if (elem.length == 0) {
          console.error(`${this.constructor.name} template is missing '${prop}': '${spec}'`);
        }
        this[prop] = elem;
        continue;
      }
      var stub = this.dobs.find(spec[0]).first();
      if (!stub || stub.length == 0) {
        console.error(`${this.constructor.name} template is missing '${prop}': ['${spec[0]}', ${spec[1].name}]`);
      } else if (stub.length == 1) {
        var subComponent = this.donutFactory.donutBake(spec[1], stub.find("[replace]"), stub, spec[2]);
        this[prop] = subComponent;
        var stubElement = stub.get(0);
        stubElement.parentNode.replaceChild(subComponent.dobs.get(0), stubElement);
      } else {
        throw new Error(`malformed property spec: ${spec}`);
      }
    }
    return this.dobs;
  }
  // This method mixes static methods of the target class in with the current class
  // but i haven't figured out what this is good for yet.
  //
  // Here is an example of a mixin class. Note that methods are static.
  //
  // class Mixin {
  //    static async foo() {
  //      // Do something... 'this' resolves correctly.
  //      return this.foo;
  // }
  //
  mixIn(clazz) {
    var keys = Object.keys(clazz);
    for (var key of Object.getOwnPropertyNames(clazz)) {
      var value = clazz[key];
      if (typeof value != "function") {
        continue;
      }
      if (this[key]) {
        throw new Error(
          `mixing ${key} into ${typeof this}, but ${key} already exists`
        );
      }
      this[key] = value;
    }
  }
  random(min, max) {
    return Math.random() * (max - min) + min;
  }
  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  }
  render() {
  }
  show() {
    this.dobs.show();
    return this;
  }
  showIf(cond) {
    if (cond)
      this.dobs.show();
    else
      this.dobs.hide();
    return this;
  }
  signalSend(k) {
    if (!this.signals)
      return 0;
    if (!this.signals[k])
      return 0;
    var waiters = this.signals[k];
    delete this.signals[k];
    for (var resolve of waiters)
      resolve();
    return waiters.length;
  }
  signalWait(k) {
    if (!this.signals)
      this.signals = {};
    if (!this.signals[k]) {
      this.signals[k] = [];
    }
    return new Promise((resolve, reject) => {
      this.signals[k].push(resolve);
    });
  }
  // this is a method for testing
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  splice(key, index, value) {
    var obj, propKey;
    var segments = key.split(".");
    while (segments.length > 1) {
      propKey = segments.shift();
      obj = this[propKey];
      if (obj === void 0) {
        obj = {};
      } else if (typeof obj != "object") {
        throw new Error("splicing into into a non-object property");
      }
    }
    propKey = segments.shift();
    var arr = this[propKey];
    if (arr === void 0) {
      arr = this[propKey] = [];
    } else if (!Array.isArray(arr)) {
      throw new Error("splicing into into a non-array property");
    }
    arr[index] = value;
  }
  text(text) {
    this.dobs.text(text);
  }
};

// src/CreationActions.ts
var CreationActions = class extends Donut {
  shopListAddButton;
  shareButton;
  saveButton;
  init(template, props, options) {
    template = html`
    <div class="flex justify-center gap-3 w-full pt-3 p-3 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
    <button
      class="saveButton h-full rounded bg-white border border-emerald-900/40 px-4 py-2.5 text-xs font-semibold tracking-wide text-emerald-900 active:bg-emerald-50 active:border-emerald-900 active:scale-95 transition-all duration-200 shadow-sm">
      Save
    </button>
    <button
      class="shareButton h-full rounded bg-white border border-emerald-900/40 px-4 py-2.5 text-xs font-semibold tracking-wide text-emerald-900 active:bg-emerald-50 active:border-emerald-900 active:scale-95 hover:background-emerald-900 transition-all duration-200 shadow-sm">
      Share
    </button>
    <button
      class="shopListAddButton h-full rounded bg-emerald-900 text-emerald-50 px-4 py-2.5 text-sm font-semibold tracking-wide active:bg-emerald-800 active:scale-95 transition-all duration-200 shadow-md">
      Add to Shop List
    </button>
    </div>`;
    super.init(template, {
      shopListAddButton: ".shopListAddButton",
      shareButton: ".shareButton",
      saveButton: ".saveButton"
    }, options);
    this.shopListAddButton.on("click touch", () => this.a.onShopListAdd());
    this.shareButton.on("click touch", () => this.a.onShare());
    this.saveButton.on("click touch", () => this.a.onSave());
    return this.dobs;
  }
};

// src/CreationFooter.ts
AddCSS("CreationFooter", css`
  .make-footer-container {
    margin-top: 1.5rem;
    border-top: 1px solid rgba(6, 78, 59, 0.1);
    padding-top: 0.75rem;
  }

  .make-footer-message {
    text-align: center;
    font-size: 0.7rem;
    letter-spacing: 0.25em;
    color: rgba(6, 78, 59, 0.7);
    text-transform: uppercase;
  }
`);
var CreationFooter = class extends Donut {
  init(template, props, options) {
    template = html`
    <div>
      <!-- Message -->
      <div class="make-footer-container">
        <p class="make-footer-message">
          A Fresh Take on Coastal Living
        </p>
      </div>
    </div>`;
    super.init(template, {}, options);
    return this.dobs;
  }
};

// src/CreationHeader.ts
AddCSS("CreationHeader", css`
  .make-header-container {
    position: relative;
    margin: 0.5rem;
    text-align: center;
    padding: 0.5rem;
  }

  .make-header-corner-tl {
    position: absolute;
    top: 0;
    left: 0;
    width: 1rem;
    height: 1rem;
    border-top: 2px solid rgba(6, 78, 59, 0.4);
    border-left: 2px solid rgba(6, 78, 59, 0.4);
  }

  .make-header-corner-tr {
    position: absolute;
    top: 0;
    right: 0;
    width: 1rem;
    height: 1rem;
    border-top: 2px solid rgba(6, 78, 59, 0.4);
    border-right: 2px solid rgba(6, 78, 59, 0.4);
  }

  .make-header-corner-bl {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 1rem;
    height: 1rem;
    border-bottom: 2px solid rgba(6, 78, 59, 0.4);
    border-left: 2px solid rgba(6, 78, 59, 0.4);
  }

  .make-header-corner-br {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 1rem;
    height: 1rem;
    border-bottom: 2px solid rgba(6, 78, 59, 0.4);
    border-right: 2px solid rgba(6, 78, 59, 0.4);
  }

  .make-header-title {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.2em;
    color: rgba(6, 78, 59, 0.8);
    text-transform: uppercase;
  }

  .make-header-subtitle {
    margin-top: 0.25rem;
    font-size: 0.7rem;
    letter-spacing: 0.25em;
    color: rgba(6, 78, 59, 0.6);
    text-transform: uppercase;
  }
`);
var CreationHeader = class extends Donut {
  init(template, props, options) {
    template = html`
  <div class="make-header-container">
    <!-- Corner decorations -->
    <div class="make-header-corner-tl"></div>
    <div class="make-header-corner-tr"></div>
    <div class="make-header-corner-bl"></div>
    <div class="make-header-corner-br"></div>

    <!-- Side accent marks -->
    <!--
      <div class="absolute top-1/2 left-0 w-2 h-px bg-emerald-900/40 -translate-y-1/2"></div>
      <div class="absolute top-1/2 right-0 w-2 h-px bg-emerald-900/40 -translate-y-1/2"></div>
    -->

    <p class="make-header-title">
      FarmGoods Market
    </p>
    <p class="make-header-subtitle">
      - Mocktail Series -
    </p>
  </div>`;
    super.init(template, {}, options);
    return this.dobs;
  }
};

// src/satori/Eventful.ts
var Eventful = class {
  handlers;
  handlersById;
  constructor() {
  }
  // do(fn, ...staticArgs) {
  //   if (!fn) throw new Error('no function to do')
  //   return (...dynamicArgs) => {
  //     return fn.apply(this, [...staticArgs, ...dynamicArgs])
  //   }
  // }
  go(event, ...staticArgs) {
    return (...dynamicArgs) => {
      var promises = [];
      if (this.handlers && this.handlers[event])
        this.handlers[event].forEach(function(handler) {
          promises.push(handler(...staticArgs, ...dynamicArgs));
        });
      return Promise.all(promises);
    };
  }
  off(event, handlerId) {
    if (!this.handlers) this.handlers = {};
    if (!this.handlersById) this.handlersById = {};
    var handler = this.handlersById[handlerId];
    var events = event.split(/\s+/);
    for (event of events) {
      if (!this.handlers[event]) continue;
      if (handler) {
        var index = this.handlers[event].indexOf(handler);
        if (index == -1) continue;
        this.handlers[event].splice(index, 1);
      } else {
        this.handlers[event] = [];
      }
    }
  }
  // event handling services
  on(event, handler, handlerId) {
    if (!this.handlers) this.handlers = {};
    if (!this.handlersById) this.handlersById = {};
    if (handlerId) this.handlersById[handlerId] = handler;
    var events = event.split(/\s+/);
    for (event of events) {
      if (!this.handlers[event]) {
        this.handlers[event] = [];
      }
      this.handlers[event].push(handler);
    }
  }
  onAll(handlers) {
    for (var [key, value] of Object.entries(handlers)) {
      this.on(key, value);
    }
  }
};

// src/satori/Style.ts
function css2(strings, ...args) {
  return strings[0];
}
function StyleAdd(t, s) {
  const style = document.createElement("style");
  style.textContent = s;
  style.title = t;
  document.head.appendChild(style);
}

// src/satori/Router.ts
StyleAdd("Router", css2`
/* for Firefox */
.killscrollbar {
      scrollbar-width: none;
}

/* for Chrome */
.killscrollbar::-webkit-scrollbar {
  display: none;
}
`);
var Router = class extends Eventful {
  a;
  app;
  depth;
  historyItemLast;
  historyItemQueue;
  lastRoute;
  pathname;
  playCount;
  playedOnce = false;
  playing = false;
  routes;
  routePrefix;
  scrollTop = 0;
  windowHeight;
  windowWidth;
  constructor(app) {
    super();
    this.app = app;
    this.depth = history.state && history.state.depth || 0;
    this.historyItemQueue = [];
    this.a = { onRender: async () => {
    } };
    this.playCount = 0;
    this.routes = [];
    var router = this;
    history.scrollRestoration = "manual";
    window.onpopstate = function(ev) {
      router.app.blurAllPlay();
      window.errorScreenStop();
      router.queueNext();
    };
  }
  static aToURLParams(a) {
    for (var k in a) if (a[k] === void 0) delete a[k];
    if (Object.keys(a).length == 0) return "";
    var urlSearchParams = new URLSearchParams(a);
    urlSearchParams.sort();
    return urlSearchParams.toString();
  }
  jumpPlay(url, replaceState = false) {
    return this.playFwd(url, replaceState, "jump");
  }
  playAnimation(donut, type) {
    if (!donut) return;
    donut.dobs.stop(true, true);
    var duration = 300;
    if (type == "righttocenter") {
      donut.dobs.css({
        position: "relative",
        top: 0,
        left: this.windowWidth,
        display: "block"
      });
      donut.dobs.stop(true, true).animate({ left: 0 }, { left: "linear" }, duration).then(() => donut.dobs.css("position", ""));
    } else if (type == "lefttocenter") {
      donut.dobs.css({
        position: "relative",
        top: 0,
        left: -this.windowWidth,
        display: "block"
      });
      donut.dobs.stop(true, true).animate({ left: 0 }, { left: "linear" }, duration).then(() => donut.dobs.css("position", ""));
    } else if (type == "toptocenter") {
      donut.dobs.css({
        position: "relative",
        top: -this.windowHeight,
        left: 0,
        display: "block"
      });
      donut.dobs.stop(true, true).animate({ top: 0 }, { top: "linear" }, duration).then(() => donut.dobs.css("position", ""));
    } else if (type == "bottomtocenter") {
      donut.dobs.css({
        position: "relative",
        top: this.windowHeight,
        left: 0,
        display: "block"
      });
      donut.dobs.stop(true, true).animate({ top: 0 }, { top: "linear" }, duration).then(() => donut.dobs.css("position", ""));
    } else if (type == "centertoleft") {
      donut.dobs.css("position", "absolute");
      donut.dobs.stop(true, true).animate(
        { left: -this.windowWidth },
        { left: "linear" },
        duration
      ).then(() => {
        donut.dobs.hide();
        donut.css("position", "");
      });
    } else if (type == "centertoright") {
      donut.dobs.css("position", "absolute");
      donut.dobs.stop(true, true).animate(
        { left: this.windowWidth },
        { left: "linear" },
        duration
      ).then(() => {
        donut.dobs.hide();
        donut.css("position", "");
      });
    } else if (type == "centertotop") {
      donut.dobs.stop(true, true).animate(
        { top: -this.windowHeight },
        { top: "linear" },
        duration
      ).then(() => {
        donut.dobs.hide();
        donut.css("position", "");
      });
    } else if (type == "centertobottom") {
      donut.dobs.stop(true, true).animate(
        { top: this.windowHeight },
        { top: "linear" },
        duration
      ).then(() => {
        donut.dobs.hide();
        donut.css("position", "");
      });
    } else if (type == "fadein") {
      donut.dobs.css({
        position: "absolute",
        top: 0,
        left: 0,
        display: "block",
        opacity: 0
      });
      donut.dobs.stop(true, true).animate(
        { opacity: 1 },
        { opacity: "linear" },
        duration
      ).then(() => {
        donut.dobs.css("opacity", "");
        donut.css("position", "");
      });
    } else if (type == "fadeout") {
      donut.dobs.css({
        position: "absolute",
        top: 0,
        left: 0,
        display: "block",
        opacity: 1
      });
      donut.dobs.stop(true, true).animate(
        { opacity: 0 },
        { opacity: "linear" },
        duration
      ).then(() => {
        donut.dobs.hide();
        donut.dobs.css("opacity", "");
        donut.css("position", "");
      });
    }
  }
  playBwd() {
    history.back();
  }
  // playFwd
  playFwd(url, replaceState = false, transition = "fwd", depthNext = null) {
    var [pathname, params] = this.urlParse(url);
    var nextRoute = this.routeGet(pathname);
    var nextUrl = nextRoute.handler.resolve(params, url);
    if (this.playedOnce && history.state && history.state.url == nextUrl) {
      return;
    }
    this.playedOnce = true;
    var depth = this.depth;
    if (replaceState) history.replaceState({ depth: depthNext || depth, fwdTransition: transition, url }, "", url);
    else history.pushState({ depth: depthNext || depth + 1, fwdTransition: transition, url }, "", url);
    this.queueNext();
  }
  async playNext() {
    if (this.historyItemQueue.length == 0) return;
    if (this.playing) return;
    var next = this.historyItemQueue.shift();
    if (!next) return;
    this.playing = true;
    this.playCount++;
    if (next.state == null) next.state = { depth: 0 };
    if (this.historyItemLast && this.historyItemLast.url == next.url) {
      this.playing = false;
      return;
    }
    var steps = next.state["depth"] - this.depth;
    var [pathname, nextParams] = this.urlParse(next.url);
    var nextRoute = this.routeGet(pathname);
    try {
      var throwReroute = (reroute) => {
        if (reroute) throw reroute;
      };
      for (var mw of nextRoute.mws) await mw(next.url)();
      if (this.lastRoute)
        if (steps >= 0) await this.lastRoute.handler.stopFwdOK().then(throwReroute);
        else await this.lastRoute.handler.stopBwdOK().then(throwReroute);
      if (steps >= 0) await nextRoute.handler.playFwdOK(nextParams).then(throwReroute);
      else await nextRoute.handler.playBwdOK(nextParams).then(throwReroute);
      if (this.lastRoute) {
        if (steps >= 0) await this.lastRoute.handler.stopFwd();
        else await this.lastRoute.handler.stopBwd();
      }
      var lastRoute = this.lastRoute;
      this.lastRoute = void 0;
      this.depth = next.state["depth"];
      this.historyItemLast = next;
      this.pathname = pathname;
      if (steps >= 0) await nextRoute.handler.playFwd(nextParams);
      else await nextRoute.handler.playBwd(nextParams);
      document.title = nextRoute.handler.titleGet();
      nextRoute.handler.render();
      await this.playTransition(next.transition, nextRoute, lastRoute);
      this.lastRoute = nextRoute;
      this.playing = false;
      if (this.historyItemQueue.length > 0) {
        return this.playNext();
      } else {
        this.a.onRender();
      }
    } catch (err) {
      this.playing = false;
      if (err.action == "fwd") {
        this.depth = next.state["depth"];
        this.historyItemLast = next;
        this.pathname = pathname;
        return this.playFwd(err.url, false, next.transition);
      }
      if (err.action == "redirect") {
        return this.playFwd(err.url, true, next.transition, next.state["depth"]);
      } else if (err.action == "bwd") {
        if (next.state["depth"] == 0) return this.playFwd("/", true, next.transition);
        else return this.playBwd();
      } else if (err.action == "abort") {
        history.go(-steps);
        return;
      }
      throw err;
    } finally {
    }
  }
  playTransition(direction, nextRoute, lastRoute) {
    if (lastRoute == nextRoute) {
      return Promise.resolve();
    }
    return new Promise(
      (resolve, reject) => {
        if (lastRoute && lastRoute.handler && lastRoute.handler == nextRoute.handler) resolve();
        this.windowWidth = window.innerWidth;
        this.windowHeight = window.innerHeight;
        this.scrollTop = this.app.scrollingElement.scrollTop();
        var duration = 300;
        if (direction == "jump") {
          this.app.scrollingElement.stop(true, true).animate(
            { scrollTop: 0 },
            { scrollTop: "linear" }
          );
          if (lastRoute && lastRoute.handler) {
            this.playAnimation(lastRoute.handler.screen, "fadeout");
          }
          this.playAnimation(nextRoute.handler.screen, "fadein");
        } else if (direction == "fwd") {
          this.app.scrollingElement.addClass("killscrollbar");
          let lastDonut = lastRoute && lastRoute.handler ? lastRoute.handler.screen : void 0;
          if (lastDonut) {
            lastDonut.scrollTop = this.scrollTop;
            lastDonut.dobs.css({
              "z-index": 1,
              display: "block",
              height: this.scrollTop + this.windowHeight,
              overflow: "hidden",
              position: "absolute",
              top: 0
            });
          }
          let nextDonut = nextRoute.handler.screen;
          nextDonut.scrollTop = nextDonut.scrollTop || 0;
          nextDonut.dobs.css({
            "z-index": 0,
            display: "block",
            position: "absolute",
            top: this.scrollTop + this.windowHeight - nextDonut.scrollTop
          });
          this.app.scrollingElement.stop(true, true).animate(
            { scrollTop: this.scrollTop + this.windowHeight },
            { scrollTop: "easeInOutSine" },
            duration
          ).then(() => {
            if (lastDonut) {
              lastDonut.dobs.css({
                "z-index": "",
                display: "none",
                height: "",
                overflow: "",
                top: 0
              });
            }
            nextDonut.dobs.css({
              "z-index": "",
              display: "",
              top: 0
            });
            this.scrollTop = nextDonut.scrollTop;
            this.app.scrollingElement.scrollTop(nextDonut.scrollTop);
            this.app.scrollingElement.removeClass("killscrollbar");
            resolve();
          });
        } else if (direction == "bwd") {
          this.app.scrollingElement.addClass("killscrollbar");
          let nextDonut = nextRoute.handler.screen;
          nextDonut.scrollTop = nextDonut.scrollTop || 0;
          let lastDonut = lastRoute && lastRoute.handler ? lastRoute.handler.screen : void 0;
          if (lastDonut) {
            lastDonut.scrollTop = this.scrollTop;
            lastDonut.dobs.css({
              "z-index": 0,
              display: "block",
              top: nextDonut.scrollTop + this.windowHeight - lastDonut.scrollTop
            });
            this.app.scrollingElement.scrollTop(nextDonut.scrollTop + this.windowHeight);
          }
          nextDonut.dobs.css({
            "z-index": 1,
            display: "block",
            height: nextDonut.scrollTop + this.windowHeight,
            overflow: "hidden",
            top: 0
          });
          this.app.scrollingElement.stop(true, true).animate(
            { scrollTop: nextDonut.scrollTop },
            { scrollTop: "easeInOutSine" },
            duration
            // function (val: number) {
            //   lastDonut && lastDonut.dobs.css('transform', `translateY(${val}px)`)
            //   nextDonut.dobs.css('transform', `translateY(${val}px)`)
            // },
          ).then(() => {
            if (lastDonut)
              lastDonut.dobs.css({
                "z-index": "",
                display: "none",
                top: 0
                // transform: ''
              });
            nextDonut.dobs.css({
              "z-index": "",
              display: "",
              height: "",
              overflow: "",
              top: 0
              // transform: ''
            });
            this.app.scrollingElement.removeClass("killscrollbar");
            resolve();
          });
        }
      }
    );
  }
  // onpopstate
  // This is called when the user presses the browser
  // fwd or bak buttons. We have to code around the case where the
  // user is mashing these buttons. To do that, we always save
  // what we think is he next destination with the best info
  // we have available to determine how to visually transition.
  queueNext() {
    var transition = this.depth && history.state != null && this.depth > history.state["depth"] ? "bwd" : "fwd";
    var state = JSON.parse(JSON.stringify(history.state));
    var historyItem = {
      url: window.location.pathname + window.location.search,
      state,
      transition
    };
    this.historyItemQueue.push(historyItem);
    this.playNext();
    return;
  }
  reRender() {
    this.lastRoute?.handler.render();
  }
  routeAdd(pseudoPattern, mws, handler) {
    if (handler === void 0) throw new Error("undefined handler for route $(pseudoPattern)");
    var regexp = new RegExp(`^${pseudoPattern}$`);
    this.routes.push({ pseudoPattern, regexp, mws, handler });
  }
  /**
      Lifecycle of a Route Transition
      -------------------------------
      Pages can implement entry checks to determine if it is ok to enter the page (eg. check that the shopping cart as content).
      They can also implement exit checks to determine if it is ok to leave the page (eg. check that an object is saved).
      The router must perform these entry and exit checks before modifying its internal state, to allow the routes
      to abort the transition without corrupting things.
  
      But in a single-page app, we might be trying to transition from one page to the "same" page.
      If that page has an admission / entry "gate" or "check", we need to check those without disturbing the current
      state of the page. Furthermore, if that page does work to complete the entry check (eg. hydrate) that we are
      able to leverage that work if we actually transition to the page. We don't want to do it twice.
  
      The router will not make any assumptions or enforce design patterns on the internal structure of check methods.
      If a component needs to cache the work it does to perform a check, it must do that internally.
  
      Furthermore, page exits should not depend on which page will get actuated next, so exit checks are allowed to use
      only their existing state to perform the check.
  
      Finally... once the checks pass, the routes are obligated to stop and play without exception. While we do our
      best to recover the router state when exeptions happen here, we cannot guarantee that the user can dismiss
      an error and continue using the application normally without reload. There for production error handlers
      should probably force a reload when errors happen at this point.
     */
  routeGet(pathname) {
    if (this.routePrefix && pathname.startsWith(this.routePrefix))
      pathname = pathname.slice(this.routePrefix.length);
    var matchingRoutes = [];
    for (var route of this.routes) if (pathname.match(route.regexp)) matchingRoutes.push(route);
    if (matchingRoutes.length == 0) throw new Error(`no matching route for ${pathname}`);
    else if (matchingRoutes.length > 1) throw new Error(`multiple matching routes for ${pathname}`);
    var nextRoute = matchingRoutes[0];
    return nextRoute;
  }
  urlParamGet(url, name) {
    if (url == void 0) return void 0;
    var indexOfQ = url.indexOf("?");
    if (indexOfQ == -1) return void 0;
    var encodedParams = url.substring(indexOfQ + 1);
    if (encodedParams == "") return void 0;
    var v = new URLSearchParams(encodedParams).get(name);
    if (v == "null") return void 0;
    if (v === null) return void 0;
    if (v == "undefined") return void 0;
    return v;
  }
  urlParamSet(k, v) {
    var historyItemLast = window.app.router.historyItemLast;
    var root = historyItemLast.url;
    var indexOfQ = historyItemLast.url.indexOf("?");
    var paramString = indexOfQ == -1 ? "" : historyItemLast.url.substring(indexOfQ + 1);
    var root = indexOfQ == -1 ? historyItemLast.url : historyItemLast.url.substring(0, indexOfQ);
    var urlSearchParams = new URLSearchParams(paramString);
    urlSearchParams.set(k, v);
    historyItemLast.url = root + "?" + urlSearchParams.toString();
    history.replaceState(historyItemLast.state, this.lastRoute?.handler.titleGet() || "", historyItemLast.url);
  }
  urlParse(url) {
    var pos = url.indexOf("?");
    var path = pos == -1 ? url : url.substring(0, pos);
    if (path.startsWith("/")) path = path.substring(1);
    var a = {};
    var indexOfQ = url.indexOf("?");
    if (indexOfQ > -1) {
      var encodedParams = url.substring(indexOfQ + 1);
      if (encodedParams != "") {
        var searchParams = new URLSearchParams(encodedParams);
        searchParams.forEach((v, k) => {
          if (v == "false") a[k] = false;
          else if (v == "true") a[k] = true;
          else if (v == "null") a[k] = null;
          else if (v == "undefined") a[k] = void 0;
          else a[k] = v;
        });
      }
    }
    return [path, a];
  }
};
var RedirectRoute = class {
  conf;
  router;
  constructor(router, conf) {
    this.router = router;
    this.conf = conf;
  }
  async playBwd(a) {
  }
  async playBwdOK(a) {
    return {
      action: "redirect",
      url: this.resolve(a, void 0)
    };
  }
  async playFwd(a) {
  }
  async playFwdOK(a) {
    return {
      action: "redirect",
      url: this.resolve(a, void 0)
    };
  }
  render() {
  }
  async stop() {
  }
  async stopBwd() {
    throw { code: "undefined" };
  }
  async stopBwdOK() {
    return;
  }
  async stopFwd() {
    throw { code: "undefined" };
  }
  async stopFwdOK() {
    return;
  }
};

// src/satori/Screen.ts
var ScreenRoute = class {
  app;
  screen;
  constructor(app, screen) {
    this.app = app;
    this.screen = screen;
  }
  playBwd(a) {
    return this.screen.playBwd(a);
  }
  playBwdOK(a) {
    return this.screen.playBwdOK(a);
  }
  playFwd(a) {
    return this.screen.playFwd(a);
  }
  playFwdOK(a) {
    return this.screen.playFwdOK(a);
  }
  render() {
    this.screen.render();
  }
  resolve(a, url) {
    return url;
  }
  stopBwd() {
    return this.screen.stopBwd();
  }
  stopBwdOK() {
    return this.screen.stopBwdOK();
  }
  stopFwd() {
    return this.screen.stopFwd();
  }
  stopFwdOK() {
    return this.screen.stopFwdOK();
  }
  titleGet() {
    return this.screen.titleGet();
  }
};
var Screen = class extends Donut {
  play(a) {
    return Promise.resolve();
  }
  playBwd(a) {
    return this.play(a);
  }
  playBwdOK(a) {
    return Promise.resolve();
  }
  playFwd(a) {
    return this.play(a);
  }
  playFwdOK(a) {
    return Promise.resolve();
  }
  stop() {
    return Promise.resolve();
  }
  stopBwd() {
    return this.stop();
  }
  stopBwdOK() {
    return Promise.resolve();
  }
  stopFwd() {
    return this.stop();
  }
  stopFwdOK() {
    return Promise.resolve();
  }
  titleGet() {
    return "Change Me!";
  }
};

// src/CreationE2EScreen.ts
AddCSS("CreationE2EScreen", css`
  .creation-e2e-screen {
    width: 100%;
    background-color: rgba(255, 255, 255, 0.95);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    overflow: hidden;
    font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
    border: 1px solid rgb(226, 232, 240);
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    padding-bottom: 5rem;
  }

  .creation-e2e-hero {
    width: 100%;
    aspect-ratio: 4/3;
  }

  .creation-e2e-hero img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .creation-e2e-content {
    padding: 1.25rem 1.5rem 1.5rem;
    max-width: 42rem;
    margin-left: auto;
    margin-right: auto;
    flex: 1;
  }

  .creation-e2e-title-section {
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .creation-e2e-title {
    font-size: 1.875rem;
    line-height: 2.25rem;
    font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
    letter-spacing: -0.025em;
    color: rgb(6, 78, 59);
  }

  .creation-e2e-desc {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    line-height: 1.625;
    color: rgb(51, 65, 85);
    font-style: italic;
  }

  .creation-e2e-bom-box {
    padding: 1rem;
    margin-bottom: 1.25rem;
    background-color: #F7F4EA;
    border-radius: 1rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    border: 1px solid #EAE6E4;
  }

  .creation-e2e-section-title {
    font-size: 1.5rem;
    line-height: 2rem;
    color: rgb(30, 41, 59);
    text-align: center;
    margin-bottom: 1rem;
  }

  .creation-e2e-bom {
    font-size: 0.875rem;
    line-height: 1.625;
    color: rgb(30, 41, 59);
  }

  .creation-e2e-bom ul {
    list-style-type: disc;
    list-style-position: inside;
  }

  .creation-e2e-bom ul li {
    margin-bottom: 0.25rem;
  }

  .creation-e2e-steps{
    margin-bottom: 1.25rem;
  }

  .creation-e2e-steps ol {
    margin-top: 0.75rem;
    list-style-type: decimal;
    list-style-position: inside;
    font-size: 0.875rem;
    line-height: 1.625;
    color: rgb(30, 41, 59);
  }

  .creation-e2e-steps ol li {
    margin-bottom: 0.25rem;
  }

  .creation-e2e-notes {
    margin-bottom: 1.5rem;
  }

  .creation-e2e-notes p {
    margin-top: 0.75rem;
    font-size: 0.75rem;
    line-height: 1.625;
    color: rgb(51, 65, 85);
  }

  .creation-e2e-actions-fixed {
    position: fixed;
    bottom: 0;
  }
`);
var CreationE2EScreen = class extends Screen {
  static URL(a) {
    return `creation-e2e?${Router.aToURLParams(a)}`;
  }
  creation;
  title;
  desc;
  heroImg;
  bom;
  steps;
  notes;
  makeFooter;
  init(template, props, options) {
    var template = html`
    <div class="creation-e2e-screen">
      <div class="creationHeader"></div>

      <!-- Edge-to-edge hero image -->
      <div class="creation-e2e-hero">
        <img class="creation-e2e-hero-img" src="" alt="" />
      </div>

      <!-- Content -->
      <div class="creation-e2e-content">

        <!-- Title + Desc -->
        <div class="creation-e2e-title-section">
          <h1 class="creation-e2e-title"></h1>
          <p class="creation-e2e-desc"></p>
        </div>

        <!-- BOM -->
        <div class="creation-e2e-bom-box">
          <h2 class="creation-e2e-section-title">Ingredients</h2>
          <div class="creation-e2e-bom">
            <ul class="creation-e2e-bom-list"></ul>
          </div>
        </div>

        <!-- Steps -->
        <div class="creation-e2e-steps">
          <h2 class="creation-e2e-section-title">Steps</h2>
          <ol class="creation-e2e-steps-list"></ol>
        </div>

        <!-- Notes -->
        <div class="creation-e2e-notes">
          <h2 class="creation-e2e-section-title">Notes</h2>
          <p class="creation-e2e-notes-p"></p>
        </div>

        <!-- Footer brand line -->
        <div class="makeFooter"></div>
      </div>

      <div class='makeActions creation-e2e-actions-fixed'></div>
    </div>`;
    super.init(template, {
      creationHeader: [".creationHeader", CreationHeader],
      makeFooter: [".makeFooter", CreationFooter],
      makeActions: [".makeActions", CreationActions],
      title: ".creation-e2e-title",
      desc: ".creation-e2e-desc",
      heroImg: ".creation-e2e-hero-img",
      bom: ".creation-e2e-bom-list",
      steps: ".creation-e2e-steps-list",
      notes: ".creation-e2e-notes-p"
    }, options);
    return this.dobs;
  }
  async play(a) {
    this.a = a;
    let creation = await dao.CreationGetByID(this.a.id);
    if (creation == void 0) {
      throw new Error("does not exist");
    }
    this.creation = creation;
  }
  render() {
    this.title.text(this.creation.title);
    this.desc.text(this.creation.desc);
    this.heroImg.attr("src", this.creation.heroImg);
    this.heroImg.attr("alt", this.creation.title);
    this.notes.text(this.creation.notes);
    this.bom.empty();
    this.creation.bom.forEach((ingredient) => {
      const li = ingredient.link ? `<li><a href="${ingredient.link}" target="_blank">${ingredient.title}</a></li>` : `<li>${ingredient.title}</li>`;
      this.bom.append(li);
    });
    this.steps.empty();
    this.creation.steps.forEach((step) => {
      this.steps.append(`<li>${step}</li>`);
    });
  }
};

// src/CreationBrief.ts
AddCSS("CreationBrief", css`
  .creation-brief-card {
    width: 100%;
    max-width: 42rem;
    margin-left: auto;
    margin-right: auto;
    background-color: white;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    border: 1px solid rgb(241, 245, 249);
    overflow: hidden;
    display: flex;
    gap: 1rem;
    padding: 0.75rem;
    transition: all 0.2s ease-out;
    cursor: pointer;
  }

  .creation-brief-card:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    transform: translateY(-0.125rem);
  }

  @media (min-width: 640px) {
    .creation-brief-card {
      padding: 1rem;
    }
  }

  .creation-brief-thumbnail {
    flex-shrink: 0;
  }

  .creation-brief-thumb-wrapper {
    width: 6rem;
    height: 6rem;
    border-radius: 1rem;
    overflow: hidden;
    background-color: rgb(241, 245, 249);
  }

  @media (min-width: 640px) {
    .creation-brief-thumb-wrapper {
      width: 7rem;
      height: 7rem;
    }
  }

  .creation-brief-thumb-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .creation-brief-content {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .creation-brief-header {
    margin-bottom: 0.25rem;
  }

  .creation-brief-title {
    font-size: 1.125rem;
    font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
    font-weight: 600;
    color: rgb(6, 78, 59);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (min-width: 640px) {
    .creation-brief-title {
      font-size: 1.25rem;
    }
  }

  .creation-brief-desc {
    font-size: 0.75rem;
    color: rgb(71, 85, 105);
    line-height: 1.375;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  @media (min-width: 640px) {
    .creation-brief-desc {
      font-size: 0.875rem;
    }
  }

  .creation-brief-meta {
    margin-top: 0.5rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem 0.75rem;
    font-size: 0.75rem;
    color: rgb(51, 65, 85);
  }

  @media (min-width: 640px) {
    .creation-brief-meta {
      font-size: 0.75rem;
    }
  }

  .creation-brief-meta-item {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }

  .creation-brief-footer {
    margin-top: 0.75rem;
    font-size: 0.65rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: rgb(148, 163, 184);
  }
`);
var CreationBrief = class extends Donut {
  // Private Cash elements for dynamic content
  heroImg;
  title;
  desc;
  timeMetaIcon;
  timeMeta;
  tagMetaIcon;
  tagMeta;
  brandFooter;
  init(template, props, options) {
    template = html`
<div class="creation-brief-card">
  <!-- Thumbnail -->
  <div class="creation-brief-thumbnail">
    <div class="creation-brief-thumb-wrapper">
      <img class="creation-hero-img" src="" alt="" />
    </div>
  </div>

  <!-- Text content -->
  <div class="creation-brief-content">
    <!-- Title + tagline -->
    <header class="creation-brief-header">
      <h2 class="creation-brief-title"></h2>
      <p class="creation-brief-desc"></p>
    </header>

    <!-- Meta row -->
    <div class="creation-brief-meta">
      <span class="creation-brief-meta-item">
        <span class="creation-time-meta-icon" aria-hidden="true"></span>
        <span class="creation-time-meta"></span>
      </span>
      <span class="creation-brief-meta-item">
        <span class="creation-ingredient-meta-icon" aria-hidden="true"></span>
        <span class="creation-ingredient-meta"></span>
      </span>
      <span class="creation-brief-meta-item">
        <span class="creation-tag-meta-icon" aria-hidden="true"></span>
        <span class="creation-tag-meta"></span>
      </span>
    </div>

    <!-- Brand line -->
    <footer class="creation-brief-footer"></footer>
  </div>
</div>`;
    super.init(template, {
      heroImg: ".creation-hero-img",
      title: ".creation-brief-title",
      desc: ".creation-brief-desc",
      timeMetaIcon: ".creation-time-meta-icon",
      timeMeta: ".creation-time-meta",
      tagMetaIcon: ".creation-tag-meta-icon",
      tagMeta: ".creation-tag-meta",
      brandFooter: ".creation-brief-footer"
    }, options);
    this.dobs.on("click", async () => {
      if (this.a.onClick) {
        await this.a.onClick(this.a.creation);
      }
    });
    return this.dobs;
  }
  async play(creation) {
    this.a.creation = creation;
    this.render();
  }
  render() {
    if (!this.a.creation) return;
    this.title.text(this.a.creation.title);
    this.desc.text(this.a.creation.desc);
    this.heroImg.attr("src", this.a.creation.heroImg);
    this.heroImg.attr("alt", this.a.creation.title);
    this.timeMetaIcon.text("\u23F1");
    this.timeMeta.text(this.a.creation.time);
    this.tagMetaIcon.text("\u{1F33F}");
    this.tagMeta.text(this.a.creation.tags?.join(" "));
    this.brandFooter.text("FarmGoods Market");
  }
};

// src/satori/List.ts
var List = class extends Donut {
  itemDonuts;
  listDob;
  constructor() {
    super();
    this.itemDonuts = [];
  }
  init(template, props, options) {
    template = html`
<div class='list'></div>`;
    super.init(template, props, options);
    this.a.docs = [];
    this.listDob = this.dobs.get(0);
    return this.dobs;
  }
  itemDonutGet(i) {
    if (this.itemDonuts[i]) return this.itemDonuts[i];
    var donut = this.donutFactory.donutBake(this.a.item.class, void 0, void 0, this.a.item.options);
    if (this.a.item.a)
      for (var key of Object.keys(this.a.item.a))
        donut.a[key] = this.a.item.a[key];
    this.listDob.append(donut.dobs.get(0));
    this.itemDonuts[i] = donut;
    return donut;
  }
  refresh() {
    let i = 0;
    for (; i < this.a.docs.length; i++) {
      const itemDonut = this.itemDonutGet(i);
      itemDonut.render();
    }
  }
  render() {
    var promises = [];
    var docs = this.a.docs;
    let i = 0;
    for (; i < docs.length; i++) {
      const itemDonut = this.itemDonutGet(i);
      const j = i;
      this.a.item.docSet(itemDonut, docs[j]);
      itemDonut.dobs.show();
      promises.push(this.a.item.render(itemDonut));
    }
    for (; i < this.itemDonuts.length; i++)
      this.itemDonuts[i].dobs.hide();
    return Promise.all(promises);
  }
  async valueIsValidAndFinal() {
  }
};

// src/satori/IList.ts
var VIList = class {
  // public a: {}
  hasMore = false;
  list;
  page0Loaded = false;
  pageGet;
  pageNext = 0;
  pageNextPlaying = false;
  scrollEvtListener = (evt) => {
    this.scroll(evt);
  };
  scroller;
  scrollingElement;
  constructor(scrollingElement, list, pageGet) {
    this.scrollingElement = scrollingElement;
    this.list = list;
    this.pageGet = pageGet;
  }
  init() {
    return this;
  }
  async pageNextGet() {
    this.page0Loaded = true;
    if (this.pageNextPlaying || !this.hasMore) return;
    this.pageNextPlaying = true;
    var result = await this.pageGet(this.pageNext);
    this.pageNextPlaying = false;
    if (result.length == 0) {
      this.hasMore = false;
      return;
    }
    this.pageNext++;
    this.list.a.docs.splice(this.list.a.docs.length, 0, ...result);
    this.list.render();
  }
  async play() {
    window.addEventListener("scroll", this.scrollEvtListener);
  }
  render() {
    this.list.render();
  }
  async reset() {
    this.pageNext = 0;
    this.hasMore = true;
    this.page0Loaded = false;
    if (this.list.a.docs && this.list.a.docs.length) {
      this.list.a.docs = [];
      await this.list.render();
    } else {
      this.list.a.docs = [];
    }
  }
  scroll(evt) {
    if (this.scrollingElement.scrollTop() + 2 * window.innerHeight < document.body.clientHeight) {
      return;
    }
    this.pageNextGet();
  }
  stop() {
    window.removeEventListener("scroll", this.scrollEvtListener);
  }
};

// src/CreationsScreen.ts
AddCSS("CreationsScreen", css`
.creationsScreen .creations-screen-list {
  background-color: #f5f1ed;
  width: 100%;
}

.creationsScreen .creations-screen-list > * {
  margin-bottom: 1rem;
}

.creationsScreen .creations-screen-list > *:last-child {
  margin-bottom: 0;
}
`);
var CreationsScreen = class extends Screen {
  static URL(a) {
    return `creations?${Router.aToURLParams(a)}`;
  }
  iList;
  list;
  init(template, props, options) {
    var template = html`
<div class='creationsScreen'>
  <div class='screenHeader'></div>
  <div class='creations-screen-list'></div>
</div>`;
    super.init(template, {
      list: [".creations-screen-list", List],
      creationHeader: [".screenHeader", CreationHeader]
    }, options);
    this.list.a = {
      docs: [],
      item: {
        class: CreationBrief,
        docSet: (donut, doc) => donut.a.creation = doc,
        a: {
          creation: {},
          onClick: async (c) => {
            this.app.router.playFwd(CreationE2EScreen.URL({ id: c.id }));
          }
        },
        render: (donut) => donut.play(donut.a.creation).then(() => donut.render())
      }
    };
    this.iList = new VIList(
      this.app.scrollingElement,
      this.list,
      (p) => this.listPageGet(p)
    ).init();
    return this.dobs;
  }
  async play(a) {
    await this.iList.play();
    this.iList.reset();
    this.iList.pageNextGet();
  }
  async stop() {
    this.iList.stop();
  }
  render() {
  }
  listPageGet(page) {
    return dao.CreationsGet(20, page);
  }
};

// src/satori/AlertPopup.ts
var AlertPopup = class extends Donut {
  alternateButton;
  defaultButton;
  job;
  message;
  container;
  playing = false;
  queue;
  spacer;
  alertOne() {
    if (this.playing || this.queue.length == 0) return;
    this.playing = true;
    var job = this.job = this.queue.shift();
    if (!job) return;
    var {
      alternateButtonHtml,
      defaultButtonHtml,
      messageHtml,
      reject,
      resolve,
      scrimClearOnExit = true,
      scrimPlay = true,
      syncCallback = null
    } = this.job;
    if (scrimPlay) this.app.scrimPlay();
    this.message.children().detach();
    if (typeof messageHtml == "string")
      this.message.html(messageHtml);
    else {
      var donut = messageHtml;
      this.message.append(donut.dobs);
    }
    if (defaultButtonHtml) {
      this.defaultButton.show();
      this.defaultButton.html(defaultButtonHtml);
    } else {
      this.defaultButton.hide();
    }
    if (alternateButtonHtml) {
      this.alternateButton.show();
      this.alternateButton.html(alternateButtonHtml);
      this.spacer.show();
    } else {
      this.alternateButton.hide();
      this.spacer.hide();
    }
    this.container.animateCss("zoomIn");
    this.dobs.removeClass("hidden");
  }
  // play it now
  alertPlay(messageHtml, defaultButtonHtml, alternateButtonHtml, scrimClearOnExit = true, scrimPlay = true, syncCallback, positionFixed = false) {
    var promise = new Promise((resolve, reject) => {
      var job = {
        alternateButtonHtml,
        defaultButtonHtml,
        messageHtml,
        reject,
        resolve,
        scrimClearOnExit,
        scrimPlay,
        syncCallback
      };
      this.queue.push(job);
      this.alertOne();
    });
    return promise;
  }
  // play if the interval has passed
  alertPlayAsNag(id, intervalMs, messageHtml, defaultButtonHtml, alternateButtonHtml, scrimClearOnExit, scrimPlay = true, syncCallback) {
    if (!this.willPlayNag(id, intervalMs)) return Promise.resolve("s" /* Skipped */);
    this.app.stor.put(`nag::${id}`, Date.now());
    return this.alertPlay(
      messageHtml,
      defaultButtonHtml,
      alternateButtonHtml,
      scrimClearOnExit,
      scrimPlay,
      syncCallback
    );
  }
  altButtonPlay(e) {
    this.evtStop(e);
    let job = this.job;
    try {
      if (job.syncCallback) job.syncCallback("a" /* Alt */);
    } catch (err) {
      this.app.sentry.captureException(err);
    }
    this.resolve("a" /* Alt */);
  }
  defaultButtonPlay(e) {
    this.evtStop(e);
    try {
      let job = this.job;
      if (job.syncCallback) job.syncCallback("d" /* Default */);
    } catch (err) {
      this.app.sentry.captureException(err);
    }
    this.resolve("d" /* Default */);
  }
  init(template, props, options) {
    template = html`
<div class='fixed p-4 z-50 w-screen h-screen max-w-screen max-h-screen flex items-center justify-center'>
  <div class='container max-h-full bg-white dark:bg-black rounded-xl shadow'>
    <div class='markdown-body message w-full max-h-[75vh] overflow-y-auto overflow-x-auto px-3 my-3'></div>
    <div class='buttons w-full px-3 my-3'>
      <div class='alternate button tall w-full' tabindex='9101'>
        <div class='copy'>Alternate</div>
      </div>
      <div class='space w-full'>&nbsp;</div>
      <div class='default button tall w-full' tabindex='9100'>
        <div class='copy'>Default</div>
      </div>
    </div>
  </div>
</div>`;
    super.init(template, {
      alternateButton: ".alternate.button",
      spacer: ".buttons .space",
      defaultButton: ".default.button",
      message: ".message",
      container: ".container"
    }, options);
    this.queue = [];
    this.defaultButton.on("click touch", (e) => this.defaultButtonPlay(e));
    this.defaultButton.on("keydown", (e) => this.defaultButtonPlay(e));
    this.alternateButton.on("click touch", (e) => this.altButtonPlay(e));
    this.alternateButton.on("keydown", (e) => this.altButtonPlay(e));
    return this.dobs;
  }
  async resolve(choice) {
    if (!this.playing) return;
    this.container.animateCss("zoomOut");
    this.playing = false;
    this.dobs.addClass("hidden");
    var job = this.job;
    if (job.scrimClearOnExit && this.queue.length == 0) this.app.scrimStop();
    this.alertOne();
    job.resolve(choice);
  }
  // returns if the nag will play
  willPlayNag(id, intervalMs) {
    var key = `nag::${id}`;
    var lastPlayed = this.app.stor.get(key);
    var lastPlayed = lastPlayed || 0;
    var now = Date.now();
    if (now - lastPlayed < intervalMs) return false;
    return true;
  }
};

// src/satori/Storage.ts
var CookieStorage = class {
  cache;
  length = 0;
  constructor() {
    this.cache = {};
    var cs = document.cookie.split(";");
    for (var i = 0; i < cs.length; i++) {
      var c = cs[i];
      while (c.charAt(0) == " ") c = c.substring(1, c.length);
      var eqIdx = c.indexOf("=");
      var key = c.substring(0, eqIdx);
      var value = decodeURIComponent(c.substring(eqIdx + 1, c.length));
      this.cache[key] = value;
    }
  }
  clear() {
    this.cache = {};
    this.save();
  }
  getItem(key) {
    return this.cache[key];
  }
  key(index) {
    return this.keys()[index];
  }
  keys() {
    return Object.keys(this.cache);
  }
  removeItem(key) {
    delete this.cache[key];
    this.save();
  }
  save() {
    var parts = [];
    for (var key in this.cache)
      parts.push(`${key}=${encodeURIComponent(this.cache[key])}`);
    document.cookie = parts.join(";") + "; expires=; path=/";
  }
  // setItem returns true if key is changed
  setItem(key, value) {
    this.cache[key] = value;
    this.save();
  }
};
var AppStorage = class {
  ls;
  prefix;
  space;
  usingLocalStorage = false;
  constructor(space = "default") {
    this.space = space;
    try {
      var x = "asdf" + Date.now();
      localStorage.setItem(x, x);
      var y = localStorage.getItem(x);
      localStorage.removeItem(x);
      if (x !== y) {
        throw new Error();
      }
      this.ls = localStorage;
      this.usingLocalStorage = true;
    } catch (exception) {
      console.log(exception);
      this.ls = new CookieStorage();
    }
    this.prefix = "fg";
    return this;
  }
  /**
   * @memberOf Client
   */
  clear() {
    var keys = this.usingLocalStorage ? Object.keys(this.ls) : this.ls.keys();
    var prefix = `${this.prefix}::${this.space}`;
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (key.indexOf(prefix) == 0) this.ls.removeItem(key);
    }
  }
  /**
   * @memberOf Client
   */
  get(key) {
    key = `${this.space}__${key}`;
    var value = this.ls.getItem(`${this.prefix}::${key}`);
    if (value == "undefined" || value == "null" || value === void 0 || value === null)
      return void 0;
    else {
      return JSON.parse(value);
    }
  }
  /**
   * @memberOf Client
   * returns true if changed
   */
  put(key, value) {
    let current = this.get(key);
    if (current == value) return false;
    let spaceKey = `${this.space}__${key}`;
    var sval = JSON.stringify(value);
    this.ls.setItem(`${this.prefix}::${spaceKey}`, sval);
    return true;
  }
  /**
   * @memberOf Client
   * returns true if changed
   */
  remove(key) {
    let spaceKey = `${this.space}__${key}`;
    this.ls.removeItem(`${this.prefix}::${spaceKey}`);
  }
};

// src/satori/App.ts
var import_cash_dom2 = __toESM(require_cash());

// src/satori/CashExt.ts
var import_cash_dom = __toESM(require_cash());
var Animator = class _Animator {
  animByID = {};
  anims = [];
  rafId = null;
  // To store the requestAnimationFrame ID
  running = false;
  static instance;
  easingFns = {};
  constructor() {
  }
  static make() {
    if (!_Animator.instance) {
      _Animator.instance = new _Animator();
    }
    return _Animator.instance;
  }
  easingRegister(name, func) {
    this.easingFns[name] = func;
  }
  anim(element, properties, easings, duration, tick, complete) {
    this.animAdd({ element, properties, easings, duration, start: 0, initialStyles: {}, tick, complete });
  }
  animAdd(animation) {
    animation.easings = animation.easings || {};
    Object.keys(animation.properties).forEach((property) => {
      animation.easings[property] = animation.easings[property] || "linear";
    });
    if (!this.running) {
      this.running = true;
      this.rafId = requestAnimationFrame(this.tick.bind(this));
    }
    animation.start = performance.now();
    animation.initialStyles = {};
    for (const property in animation.properties) {
      if (property == "scrollTop" || property == "scrollLeft") {
        animation.initialStyles[property] = animation.element[property];
      } else {
        const computedStyle = getComputedStyle(animation.element).getPropertyValue(property);
        animation.initialStyles[property] = parseFloat(computedStyle) || 0;
      }
      this.anims.push(animation);
    }
  }
  animDel(element) {
    this.anims = this.anims.filter(
      (animation) => animation.element !== element
    );
    if (this.anims.length === 0 && this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.running = false;
      this.rafId = null;
    }
  }
  tick(timestamp) {
    this.rafId = requestAnimationFrame(this.tick.bind(this));
    const animationsToRemove = [];
    this.anims.forEach((animation, index) => {
      const { element, properties, easings, duration, start, initialStyles, complete } = animation;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      for (const property in properties) {
        const easingName = easings[property];
        const easingFunc = this.easingFns[easingName];
        const initialValue = initialStyles[property];
        const change = properties[property] - initialValue;
        const easedProgress = easingFunc(progress);
        const currentValue = initialValue + change * easedProgress;
        if (animation.tick != null) {
          animation.tick(currentValue);
        } else if (property === "scrollTop") {
          element.scrollTop = currentValue;
        } else if (property === "scrollLeft") {
          element.scrollLeft = currentValue;
        } else {
          element.style[property] = currentValue.toString();
        }
      }
      if (elapsed >= duration) {
        animationsToRemove.unshift(index);
        if (complete) complete();
      }
    });
    animationsToRemove.forEach((index) => {
      this.anims.splice(index, 1);
    });
    if (this.anims.length === 0) {
      cancelAnimationFrame(this.rafId);
      this.running = false;
      this.rafId = null;
    }
  }
};
var pow = Math.pow;
var sqrt = Math.sqrt;
var sin = Math.sin;
var cos = Math.cos;
var PI = Math.PI;
var c1 = 1.70158;
var c2 = c1 * 1.525;
var c3 = c1 + 1;
var c4 = 2 * PI / 3;
var c5 = 2 * PI / 4.5;
function bounceOut(x) {
  var n1 = 7.5625, d1 = 2.75;
  if (x < 1 / d1) {
    return n1 * x * x;
  } else if (x < 2 / d1) {
    return n1 * (x -= 1.5 / d1) * x + 0.75;
  } else if (x < 2.5 / d1) {
    return n1 * (x -= 2.25 / d1) * x + 0.9375;
  } else {
    return n1 * (x -= 2.625 / d1) * x + 0.984375;
  }
}
var animator = Animator.make();
animator.easingFns = {
  easeInQuad: function(x) {
    return x * x;
  },
  easeOutQuad: function(x) {
    return 1 - (1 - x) * (1 - x);
  },
  easeInOutQuad: function(x) {
    return x < 0.5 ? 2 * x * x : 1 - pow(-2 * x + 2, 2) / 2;
  },
  easeInCubic: function(x) {
    return x * x * x;
  },
  easeOutCubic: function(x) {
    return 1 - pow(1 - x, 3);
  },
  easeInOutCubic: function(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - pow(-2 * x + 2, 3) / 2;
  },
  easeInQuart: function(x) {
    return x * x * x * x;
  },
  easeOutQuart: function(x) {
    return 1 - pow(1 - x, 4);
  },
  easeInOutQuart: function(x) {
    return x < 0.5 ? 8 * x * x * x * x : 1 - pow(-2 * x + 2, 4) / 2;
  },
  easeInQuint: function(x) {
    return x * x * x * x * x;
  },
  easeOutQuint: function(x) {
    return 1 - pow(1 - x, 5);
  },
  easeInOutQuint: function(x) {
    return x < 0.5 ? 16 * x * x * x * x * x : 1 - pow(-2 * x + 2, 5) / 2;
  },
  easeInSine: function(x) {
    return 1 - cos(x * PI / 2);
  },
  easeOutSine: function(x) {
    return sin(x * PI / 2);
  },
  easeInOutSine: function(x) {
    return -(cos(PI * x) - 1) / 2;
  },
  easeInExpo: function(x) {
    return x === 0 ? 0 : pow(2, 10 * x - 10);
  },
  easeOutExpo: function(x) {
    return x === 1 ? 1 : 1 - pow(2, -10 * x);
  },
  easeInOutExpo: function(x) {
    return x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? pow(2, 20 * x - 10) / 2 : (2 - pow(2, -20 * x + 10)) / 2;
  },
  easeInCirc: function(x) {
    return 1 - sqrt(1 - pow(x, 2));
  },
  easeOutCirc: function(x) {
    return sqrt(1 - pow(x - 1, 2));
  },
  easeInOutCirc: function(x) {
    return x < 0.5 ? (1 - sqrt(1 - pow(2 * x, 2))) / 2 : (sqrt(1 - pow(-2 * x + 2, 2)) + 1) / 2;
  },
  easeInElastic: function(x) {
    return x === 0 ? 0 : x === 1 ? 1 : -pow(2, 10 * x - 10) * sin((x * 10 - 10.75) * c4);
  },
  easeOutElastic: function(x) {
    return x === 0 ? 0 : x === 1 ? 1 : pow(2, -10 * x) * sin((x * 10 - 0.75) * c4) + 1;
  },
  easeInOutElastic: function(x) {
    return x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? -(pow(2, 20 * x - 10) * sin((20 * x - 11.125) * c5)) / 2 : pow(2, -20 * x + 10) * sin((20 * x - 11.125) * c5) / 2 + 1;
  },
  easeInBack: function(x) {
    return c3 * x * x * x - c1 * x * x;
  },
  easeOutBack: function(x) {
    return 1 + c3 * pow(x - 1, 3) + c1 * pow(x - 1, 2);
  },
  easeInOutBack: function(x) {
    return x < 0.5 ? pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2) / 2 : (pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
  },
  easeInBounce: function(x) {
    return 1 - bounceOut(1 - x);
  },
  easeOutBounce: bounceOut,
  easeInOutBounce: function(x) {
    return x < 0.5 ? (1 - bounceOut(1 - 2 * x)) / 2 : (1 + bounceOut(2 * x - 1)) / 2;
  }
};
import_cash_dom.default.fn.animate = function(properties, easings, duration = 400, tick) {
  var el = this.get(0);
  const animator2 = Animator.make();
  return new Promise((resolve, reject) => {
    animator2.anim(el, properties, easings, duration, tick, resolve);
  });
};
import_cash_dom.default.fn.animateCss = function(animationName, callback) {
  return new Promise((resolve, reject) => {
    var animationEnd = "webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend";
    let cash4 = this.addClass("animated " + animationName);
    cash4.on(animationEnd, () => {
      resolve();
      this.removeClass("animated " + animationName);
    });
  });
};
import_cash_dom.default.fn.scrollTop = function(val) {
  var el = this.get(0);
  if (val === void 0) {
    return el.scrollTop;
  }
  el.scrollTop = val;
  return val;
};
import_cash_dom.default.fn.focus = function() {
  var el = this.get(0);
  el.focus();
  return this;
};
import_cash_dom.default.fn.stop = function(clearQueue, jumpToEnd) {
  animator.animDel(this.get(0));
  return this;
};
import_cash_dom.default.fn.showIf = function(cond) {
  if (cond) this.show();
  else this.hide();
  return this;
};
import_cash_dom.default.fn.hideIf = function(cond) {
  if (cond) this.hide();
  else this.show();
  return this;
};
import_cash_dom.default.fn.contains = function(target) {
  return this.get(0).contains(target.get(0));
};
import_cash_dom.default.fn.scrollToTargetBottom = function(target) {
  const sElem = this.get(0);
  const tElem = target.get(0);
  let elementTop = tElem.offsetTop - sElem.offsetTop;
  const elementHeight = tElem.offsetHeight;
  const elementBottom = elementTop + elementHeight;
  const scrollTo = elementBottom - sElem.offsetHeight;
  const currentScroll = sElem.scrollTop;
  if (scrollTo > currentScroll || elementBottom > currentScroll + sElem.offsetHeight) {
    sElem.scrollTo({
      top: scrollTo,
      behavior: "auto"
    });
  }
};
import_cash_dom.default.fn.scrollToTargetCenter = function(target) {
  const sElem = this.get(0);
  const tElem = target.get(0);
  let elementTop = tElem.offsetTop - sElem.offsetTop;
  const elementHeight = tElem.offsetHeight;
  const elementCenter = elementTop + elementHeight / 2;
  const scrollTo = elementCenter - sElem.offsetHeight / 2;
  const currentScroll = sElem.scrollTop;
  if (Math.abs(currentScroll - scrollTo) > 1) {
    sElem.scrollTo({
      top: scrollTo,
      behavior: "auto"
    });
  }
};
import_cash_dom.default.fn.scrollToTargetTop = function(target) {
  const sElem = this.get(0);
  const tElem = target.get(0);
  let elementTop = tElem.offsetTop - sElem.offsetTop;
  const currentScroll = sElem.scrollTop;
  if (elementTop < currentScroll || elementTop > currentScroll + sElem.offsetHeight) {
    sElem.scrollTo({
      top: elementTop,
      behavior: "auto"
    });
  }
};

// src/satori/App.ts
var App = class extends Donut {
  alertPopup;
  blurAllInput;
  conf;
  stor;
  router;
  scrimDob;
  scrollingElement;
  sentry;
  constructor() {
    super();
    this.router = new Router(this);
    this.stor = new AppStorage("main");
    this.scrollingElement = (0, import_cash_dom2.default)(document.scrollingElement || document.documentElement);
  }
  init(template, props, options) {
    this.donutFactory.init();
    super.init(template, props, options);
    return this.dobs;
  }
  alert(messageHtml, defaultButtonHtml, alternateButtonHtml, scrimClearOnExit = true, scrimPlay = true, syncCallback = async () => {
  }, positionFixed = false) {
    return this.alertPopup.alertPlay(
      messageHtml,
      defaultButtonHtml,
      alternateButtonHtml,
      scrimClearOnExit,
      scrimPlay,
      syncCallback,
      positionFixed
    );
  }
  blurAllPlay(scrollTop) {
    scrollTop = scrollTop || this.scrollingElement.scrollTop();
    this.blurAllInput.css("top", scrollTop + 20 + "px");
    window.setTimeout(() => {
      this.blurAllInput.focus();
    }, 10);
  }
  scrimPlay() {
    var y = window.scrollY;
    document.documentElement.style.top = `-${y}px`;
    document.documentElement.style.position = "fixed";
    this.scrimDob.stop(true, true);
    this.scrimDob.css("display", "block");
    this.scrimDob.animate({ opacity: 0.9 }, { opacity: "easeInSine" });
  }
  scrimStop() {
    const scrollY = document.documentElement.style.top;
    document.documentElement.style.position = "";
    document.documentElement.style.backgroundPositionY = "";
    document.documentElement.style.top = "";
    window.scrollTo(0, parseInt(scrollY || "0") * -1);
    this.scrimDob.stop(true, true);
    this.scrimDob.animate(
      { opacity: 0 },
      { opacity: "easeInSine" },
      400,
      () => {
        this.scrimDob.hide();
      }
    );
  }
  scrollToTop() {
    this.scrollingElement.stop(true, true).animate(
      { scrollTop: 0 },
      { scrollTop: "linear" }
    );
  }
};

// src/satori/DonutFactory.ts
var import_cash_dom3 = __toESM(require_cash());
var DonutFactory = class {
  factoryElement;
  factoryCash;
  services;
  constructor(services) {
    this.services = services;
  }
  dobsMakeFromTemplate(template) {
    try {
      this.factoryElement.innerHTML = template;
    } catch (err) {
      console.error(`bad Template...`);
      console.log(template);
    }
    return this.factoryCash.contents();
  }
  donutBake(clazz, transclusions, stub, options) {
    if (!clazz) {
      throw new Error("clazz.not.specified");
    }
    var donut = new clazz();
    Object.assign(donut, this.services);
    donut.donutFactory = this;
    if (!donut.init) {
      console.log("clazz.lacks.init.fn");
      console.log(`clazz is ${clazz}`);
      throw new Error("clazz.lacks.init.fn");
    }
    if (stub !== void 0) {
      var stubAttrs = stub.get(0).attributes;
      if (stubAttrs) {
        if (!options) {
          options = { attrs: stubAttrs };
        } else {
          options["attrs"] = stubAttrs;
        }
      }
    }
    donut.init(void 0, void 0, options);
    if (transclusions) {
      for (var transclusion of transclusions) {
        var replaceSelector = (0, import_cash_dom3.default)(transclusion).attr("replace");
        if (!replaceSelector) throw new Error(`could not find transclusionReplaceSelector: ${replaceSelector}`);
        donut.dobs.find(replaceSelector).replaceWith(transclusion);
      }
    }
    return donut;
  }
  init() {
    this.factoryCash = (0, import_cash_dom3.default)(document.createElement("div"));
    this.factoryElement = this.factoryCash.get(0);
  }
};

// src/satori/Auth.ts
var Auth = class {
  accessToken;
  lock;
  onAuth;
  profile;
  constructor(clientID, domainID, onAuth) {
    this.onAuth = onAuth;
    this.lock = new Auth0Lock(clientID, domainID);
    this.lock.on("authenticated", (authResult) => {
      this.lock.getUserInfo(authResult.accessToken, (error, profile) => {
        if (error) {
          alert(error);
          throw error;
        }
        this.accessToken = authResult.accessToken;
        this.profile = profile;
        this.onAuth();
      });
    });
  }
  play() {
    this.lock.show();
  }
};

// src/Main.ts
function makeApp(sentry, loader) {
  var app = new App2();
  app.conf = env;
  app.sentry = sentry;
  app.loader = loader;
  app.donutFactory = new DonutFactory({ app, conf: env, api: app.api, loader });
  return app;
}
AddCSS("Main", `
  .screen {
    width: 100%;
  }
`);
var RootRedirectRoute = class extends RedirectRoute {
  resolve(a, url) {
    return CreationsScreen.URL({});
  }
  titleGet() {
    return "Mocktails";
  }
};
var App2 = class extends App {
  // --- Properties ---
  clientId = "";
  creationE2EScreen;
  creationsScreen;
  user;
  auth;
  // --- Lifecycle ---
  constructor() {
    super();
  }
  init(template, props, options) {
    template = html`
<div class='app w-screen h-min-screen'>
  <!-- don't sort these -->
  <input class='blurAllInput h-0 w-0 opacity-0' tabindex='-1'></input>
  <div class='alertPopup hidden'></div>
  <div class='blockedBanner hidden'>Thinking...</div>
  <div class='scrimDob fixed hidden stacking top-0 left-0 z-30 w-screen h-screen bg-white dark:bg-black'></div>

  <!-- do sort these -->
  <div style='display: none' class='creationE2EScreen screen'></div>
  <div style='display: none' class='creationsScreen screen'></div>
</div>`;
    super.init(template, {
      alertPopup: [".alertPopup", AlertPopup],
      blurAllInput: ".blurAllInput",
      scrimDob: ".scrimDob",
      creationE2EScreen: [".creationE2EScreen", CreationE2EScreen],
      creationsScreen: [".creationsScreen", CreationsScreen]
    }, options);
    this.clientId = crypto.randomUUID();
    this.router.routeAdd("", [], new RootRedirectRoute(this.router, this.conf));
    this.router.routeAdd("creation-e2e", [], new ScreenRoute(this, this.creationE2EScreen));
    this.router.routeAdd("creations", [], new ScreenRoute(this, this.creationsScreen));
    return this.dobs;
  }
  async play() {
    var clientID = "zjbEhoSNgyjDqU2WQLyn7r68CYVlaiS4";
    var domainID = "dev-fb3206n2zfz32rjn.us.auth0.com";
    this.auth = new Auth(clientID, domainID, () => this.onAuth());
    this.auth.accessToken = this.stor.get("accessToken");
    this.auth.profile = this.stor.get("profile");
    if (true) {
      this.auth.accessToken = "asdf";
      this.auth.profile = {
        name: "Jeremy Kassis",
        nickname: "Jer",
        picture: "",
        user_id: "\xF1h\x9A\x8D\x90F\x84KMb\xDB\x814s",
        username: "jkassis",
        given_name: "Jeremy",
        family_name: "Kassis",
        email: "jkassis@gmail.com",
        email_verified: false,
        clientID: "asdffdsa",
        gender: "m",
        locale: "dk",
        identities: [],
        created_at: (/* @__PURE__ */ new Date()).toUTCString(),
        updated_at: (/* @__PURE__ */ new Date()).toUTCString(),
        sub: "",
        user_metadata: "",
        app_metadata: ""
      };
    }
    if (this.auth.accessToken) {
      await this.onAuth();
    }
    await this.router.playFwd("");
  }
  async onAuth() {
    this.stor.put("accessToken", this.auth.accessToken);
    this.stor.put("profile", this.auth.profile);
    await this.userGet();
    this.render();
  }
  async userGet() {
    var p = this.auth.profile;
    var res = await dao.UserGetOrCreate({
      userID: this.auth.profile.user_id,
      createParams: {
        userID: this.auth.profile.user_id,
        email: p.email,
        nameFamily: p.family_name,
        nameGiven: p.given_name,
        gender: p.gender,
        createdAt: p.created_at,
        lastLogin: p.updated_at,
        role: "user"
      }
    });
    this.user = res;
  }
};
export {
  App2 as App,
  Loader2 as Loader,
  LoadingBar,
  makeApp
};
//# sourceMappingURL=Main.js.map
