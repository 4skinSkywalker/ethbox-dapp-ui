(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["styles"],{

/***/ 2:
/*!******************************!*\
  !*** multi ./src/styles.css ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! E:\bla\src\styles.css */"OmL/");


/***/ }),

/***/ "JPst":
/*!*****************************************************!*\
  !*** ./node_modules/css-loader/dist/runtime/api.js ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
// eslint-disable-next-line func-names
module.exports = function (useSourceMap) {
  var list = []; // return the list of modules as css string

  list.toString = function toString() {
    return this.map(function (item) {
      var content = cssWithMappingToString(item, useSourceMap);

      if (item[2]) {
        return "@media ".concat(item[2], " {").concat(content, "}");
      }

      return content;
    }).join('');
  }; // import a list of modules into the list
  // eslint-disable-next-line func-names


  list.i = function (modules, mediaQuery, dedupe) {
    if (typeof modules === 'string') {
      // eslint-disable-next-line no-param-reassign
      modules = [[null, modules, '']];
    }

    var alreadyImportedModules = {};

    if (dedupe) {
      for (var i = 0; i < this.length; i++) {
        // eslint-disable-next-line prefer-destructuring
        var id = this[i][0];

        if (id != null) {
          alreadyImportedModules[id] = true;
        }
      }
    }

    for (var _i = 0; _i < modules.length; _i++) {
      var item = [].concat(modules[_i]);

      if (dedupe && alreadyImportedModules[item[0]]) {
        // eslint-disable-next-line no-continue
        continue;
      }

      if (mediaQuery) {
        if (!item[2]) {
          item[2] = mediaQuery;
        } else {
          item[2] = "".concat(mediaQuery, " and ").concat(item[2]);
        }
      }

      list.push(item);
    }
  };

  return list;
};

function cssWithMappingToString(item, useSourceMap) {
  var content = item[1] || ''; // eslint-disable-next-line prefer-destructuring

  var cssMapping = item[3];

  if (!cssMapping) {
    return content;
  }

  if (useSourceMap && typeof btoa === 'function') {
    var sourceMapping = toComment(cssMapping);
    var sourceURLs = cssMapping.sources.map(function (source) {
      return "/*# sourceURL=".concat(cssMapping.sourceRoot || '').concat(source, " */");
    });
    return [content].concat(sourceURLs).concat([sourceMapping]).join('\n');
  }

  return [content].join('\n');
} // Adapted from convert-source-map (MIT)


function toComment(sourceMap) {
  // eslint-disable-next-line no-undef
  var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap))));
  var data = "sourceMappingURL=data:application/json;charset=utf-8;base64,".concat(base64);
  return "/*# ".concat(data, " */");
}

/***/ }),

/***/ "LboF":
/*!****************************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js ***!
  \****************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var isOldIE = function isOldIE() {
  var memo;
  return function memorize() {
    if (typeof memo === 'undefined') {
      // Test for IE <= 9 as proposed by Browserhacks
      // @see http://browserhacks.com/#hack-e71d8692f65334173fee715c222cb805
      // Tests for existence of standard globals is to allow style-loader
      // to operate correctly into non-standard environments
      // @see https://github.com/webpack-contrib/style-loader/issues/177
      memo = Boolean(window && document && document.all && !window.atob);
    }

    return memo;
  };
}();

var getTarget = function getTarget() {
  var memo = {};
  return function memorize(target) {
    if (typeof memo[target] === 'undefined') {
      var styleTarget = document.querySelector(target); // Special case to return head of iframe instead of iframe itself

      if (window.HTMLIFrameElement && styleTarget instanceof window.HTMLIFrameElement) {
        try {
          // This will throw an exception if access to iframe is blocked
          // due to cross-origin restrictions
          styleTarget = styleTarget.contentDocument.head;
        } catch (e) {
          // istanbul ignore next
          styleTarget = null;
        }
      }

      memo[target] = styleTarget;
    }

    return memo[target];
  };
}();

var stylesInDom = [];

function getIndexByIdentifier(identifier) {
  var result = -1;

  for (var i = 0; i < stylesInDom.length; i++) {
    if (stylesInDom[i].identifier === identifier) {
      result = i;
      break;
    }
  }

  return result;
}

function modulesToDom(list, options) {
  var idCountMap = {};
  var identifiers = [];

  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    var id = options.base ? item[0] + options.base : item[0];
    var count = idCountMap[id] || 0;
    var identifier = "".concat(id, " ").concat(count);
    idCountMap[id] = count + 1;
    var index = getIndexByIdentifier(identifier);
    var obj = {
      css: item[1],
      media: item[2],
      sourceMap: item[3]
    };

    if (index !== -1) {
      stylesInDom[index].references++;
      stylesInDom[index].updater(obj);
    } else {
      stylesInDom.push({
        identifier: identifier,
        updater: addStyle(obj, options),
        references: 1
      });
    }

    identifiers.push(identifier);
  }

  return identifiers;
}

function insertStyleElement(options) {
  var style = document.createElement('style');
  var attributes = options.attributes || {};

  if (typeof attributes.nonce === 'undefined') {
    var nonce =  true ? __webpack_require__.nc : undefined;

    if (nonce) {
      attributes.nonce = nonce;
    }
  }

  Object.keys(attributes).forEach(function (key) {
    style.setAttribute(key, attributes[key]);
  });

  if (typeof options.insert === 'function') {
    options.insert(style);
  } else {
    var target = getTarget(options.insert || 'head');

    if (!target) {
      throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");
    }

    target.appendChild(style);
  }

  return style;
}

function removeStyleElement(style) {
  // istanbul ignore if
  if (style.parentNode === null) {
    return false;
  }

  style.parentNode.removeChild(style);
}
/* istanbul ignore next  */


var replaceText = function replaceText() {
  var textStore = [];
  return function replace(index, replacement) {
    textStore[index] = replacement;
    return textStore.filter(Boolean).join('\n');
  };
}();

function applyToSingletonTag(style, index, remove, obj) {
  var css = remove ? '' : obj.media ? "@media ".concat(obj.media, " {").concat(obj.css, "}") : obj.css; // For old IE

  /* istanbul ignore if  */

  if (style.styleSheet) {
    style.styleSheet.cssText = replaceText(index, css);
  } else {
    var cssNode = document.createTextNode(css);
    var childNodes = style.childNodes;

    if (childNodes[index]) {
      style.removeChild(childNodes[index]);
    }

    if (childNodes.length) {
      style.insertBefore(cssNode, childNodes[index]);
    } else {
      style.appendChild(cssNode);
    }
  }
}

function applyToTag(style, options, obj) {
  var css = obj.css;
  var media = obj.media;
  var sourceMap = obj.sourceMap;

  if (media) {
    style.setAttribute('media', media);
  } else {
    style.removeAttribute('media');
  }

  if (sourceMap && btoa) {
    css += "\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))), " */");
  } // For old IE

  /* istanbul ignore if  */


  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    while (style.firstChild) {
      style.removeChild(style.firstChild);
    }

    style.appendChild(document.createTextNode(css));
  }
}

var singleton = null;
var singletonCounter = 0;

function addStyle(obj, options) {
  var style;
  var update;
  var remove;

  if (options.singleton) {
    var styleIndex = singletonCounter++;
    style = singleton || (singleton = insertStyleElement(options));
    update = applyToSingletonTag.bind(null, style, styleIndex, false);
    remove = applyToSingletonTag.bind(null, style, styleIndex, true);
  } else {
    style = insertStyleElement(options);
    update = applyToTag.bind(null, style, options);

    remove = function remove() {
      removeStyleElement(style);
    };
  }

  update(obj);
  return function updateStyle(newObj) {
    if (newObj) {
      if (newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap) {
        return;
      }

      update(obj = newObj);
    } else {
      remove();
    }
  };
}

module.exports = function (list, options) {
  options = options || {}; // Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
  // tags it will allow on a page

  if (!options.singleton && typeof options.singleton !== 'boolean') {
    options.singleton = isOldIE();
  }

  list = list || [];
  var lastIdentifiers = modulesToDom(list, options);
  return function update(newList) {
    newList = newList || [];

    if (Object.prototype.toString.call(newList) !== '[object Array]') {
      return;
    }

    for (var i = 0; i < lastIdentifiers.length; i++) {
      var identifier = lastIdentifiers[i];
      var index = getIndexByIdentifier(identifier);
      stylesInDom[index].references--;
    }

    var newLastIdentifiers = modulesToDom(newList, options);

    for (var _i = 0; _i < lastIdentifiers.length; _i++) {
      var _identifier = lastIdentifiers[_i];

      var _index = getIndexByIdentifier(_identifier);

      if (stylesInDom[_index].references === 0) {
        stylesInDom[_index].updater();

        stylesInDom.splice(_index, 1);
      }
    }

    lastIdentifiers = newLastIdentifiers;
  };
};

/***/ }),

/***/ "OmL/":
/*!************************!*\
  !*** ./src/styles.css ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var api = __webpack_require__(/*! ../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "LboF");
            var content = __webpack_require__(/*! !../node_modules/css-loader/dist/cjs.js??ref--12-1!../node_modules/postcss-loader/src??embedded!./styles.css */ "W9N5");

            content = content.__esModule ? content.default : content;

            if (typeof content === 'string') {
              content = [[module.i, content, '']];
            }

var options = {};

options.insert = "head";
options.singleton = false;

var update = api(content, options);



module.exports = content.locals || {};

/***/ }),

/***/ "W9N5":
/*!*********************************************************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js??ref--12-1!./node_modules/postcss-loader/src??embedded!./src/styles.css ***!
  \*********************************************************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../node_modules/css-loader/dist/runtime/api.js */ "JPst");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0__);
// Imports

var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0___default()(true);
// Module
___CSS_LOADER_EXPORT___.push([module.i, "html {\n  scroll-behavior: smooth;\n}\n\n.main {\n  min-height: calc(100vh - 128px);\n  margin-top: 64px;\n}\n\n.btn-skewed {\n  display: inline-block;\n  transform: skewX(-0.5rad);\n  border-radius: 8px !important;\n  min-width: 100px !important;\n  padding-left: 20px;\n  padding-right: 20px;\n}\n\n.btn-skewed > a {\n  display: inline-block;\n  transform: skewX(0.5rad);\n  width: 100%;\n}\n\n.centerer {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}\n\n.bar-height {\n  height: 64px;\n}\n\n.taptarget-height {\n  height: 48px;\n}\n\n.rounded-alot {\n  border-radius: 1rem !important;\n}\n\n.rounded-alot-start {\n  border-radius: 1rem 0 0 1rem !important;\n}\n\n.rounded-alot-end {\n  border-radius: 0 1rem 1rem 0 !important;\n}\n\n.rounded-alot-top {\n  border-radius: 1rem 1rem 0 0 !important;\n}\n\n.rounded-alot-bottom {\n  border-radius: 0 0 1rem 1rem !important;\n}\n\n.btn-eboxprimary {\n  color: white;\n  background: linear-gradient(to bottom right, #afd0ff, #dc13af);\n  border-color: #afd0ff;\n}\n\n.btn-eboxprimary:hover {\n  color: white;\n  background: linear-gradient(to bottom right, #7990b0, #8f0d72);\n  border-color: #7990b0;\n}\n\n.btn-outline-eboxprimary {\n  color: #7990b0;\n  border-color: #7990b0;\n}\n\n.btn-outline-eboxprimary:hover {\n  color: white;\n  background: linear-gradient(to bottom right, #afd0ff, #dc13af);\n  border-color: #afd0ff;\n}\n\n.btn-eboxpulser {\n  transform: scale(1);\n  animation: pulse 2s infinite;\n}\n\n@keyframes pulse {\n  0% {\n    transform: scale(0.95);\n    box-shadow: 0 0 0 0 rgba(220, 19, 175, 0.7);\n  }\n\n  70% {\n    transform: scale(1);\n    box-shadow: 0 0 0 10px rgba(220, 19, 175, 0);\n  }\n\n  100% {\n    transform: scale(0.95);\n    box-shadow: 0 0 0 0 rgba(220, 19, 175, 0.7);\n  }\n}\n\n.bg-eboxprimary {\n  background: linear-gradient(to bottom right, #afd0ff, #dc13af);\n}\n\n.text-eboxprimary {\n  line-height: 1.33333;\n  background-color: #afd0ff;\n  background-image: linear-gradient(to bottom right, #afd0ff, #dc13af);\n  background-size: 100%;\n  background-clip: text;\n  -webkit-background-clip: text;\n  -moz-background-clip: text;\n  -webkit-text-fill-color: transparent; \n  -moz-text-fill-color: transparent;\n}\n\n.bg-eboxdark {\n  background: linear-gradient(to bottom right, #2d2f31, #2b1a27);\n}\n\n.bg-lightalpha {\n  background-color: rgba(255, 255, 255, 0.9) !important;\n  -webkit-backdrop-filter: blur(10px);\n          backdrop-filter: blur(10px);\n}\n\n.input-nostyle {\n  background-color: transparent;\n  border: none;\n  color: #fff;\n  min-width: 0;\n  outline: none;\n}\n\n.container-small {\n  max-width: 420px;\n  width: 100%;\n  margin: 0 auto;\n}\n\n.container-medium {\n  max-width: 840px;\n  width: 100%;\n  margin: 0 auto;\n}\n\n.mb-alot {\n  margin-bottom: 9rem;\n}\n\n.parallax {\n  background-attachment: fixed;\n  background-position: center;\n  background-repeat: no-repeat;\n  background-size: cover;\n}\n\n.bg-cover {\n  background-size: cover;\n  background-position: 50% 50%;\n}\n\n.highlight {\n  position: absolute;\n  z-index: -1;\n  width: calc(100% + 2px);\n  height: calc(100% + 2px);\n  top: -1px;\n  left: -1px;\n  background: linear-gradient(\n    to left,\n    #fec803 0%,\n    #afd0ff 21.35%,\n    #618fba 47.4%,\n    #7e75a1 65.1%,\n    #dc13af 80.21%,\n    #f61bd3 100%\n  );\n  background-size: 300% 100%;\n  filter: blur(8px);\n  border-radius: 1rem;\n  animation: animate-bg 3s infinite;\n}\n\n@keyframes animate-bg {\n  0% {\n    background-position: 100% 100%;\n  }\n  30% {\n    background-position: 20% 80%;\n  }\n  50% {\n    background-position: 40% 60%;\n  }\n  70% {\n    background-position: 60% 40%;\n  }\n  90% {\n    background-position: 80% 20%;\n  }\n  100% {\n    background-position: 100% 100%;\n  }\n}\n\n.bg-completed {\n  background: repeating-linear-gradient(\n    -55deg,\n    #3a3a3a,\n    #3a3a3a 10px,\n    #2f2f2f 10px,\n    #2f2f2f 20px\n  );\n  -webkit-backdrop-filter: blur(10px);\n          backdrop-filter: blur(10px);\n}\n\n.bg-disabled {\n  background: repeating-linear-gradient(\n    -55deg,\n    #fff,\n    #fff 10px,\n    #f8f9fa 10px,\n    #f8f9fa 20px\n  );\n  -webkit-backdrop-filter: blur(10px);\n          backdrop-filter: blur(10px);\n}\n", "",{"version":3,"sources":["webpack://src/styles.css"],"names":[],"mappings":"AAAA;EACE,uBAAuB;AACzB;;AAEA;EACE,+BAA+B;EAC/B,gBAAgB;AAClB;;AAEA;EACE,qBAAqB;EACrB,yBAAyB;EACzB,6BAA6B;EAC7B,2BAA2B;EAC3B,kBAAkB;EAClB,mBAAmB;AACrB;;AAEA;EACE,qBAAqB;EACrB,wBAAwB;EACxB,WAAW;AACb;;AAEA;EACE,aAAa;EACb,uBAAuB;EACvB,mBAAmB;AACrB;;AAEA;EACE,YAAY;AACd;;AAEA;EACE,YAAY;AACd;;AAEA;EACE,8BAA8B;AAChC;;AAEA;EACE,uCAAuC;AACzC;;AAEA;EACE,uCAAuC;AACzC;;AAEA;EACE,uCAAuC;AACzC;;AAEA;EACE,uCAAuC;AACzC;;AAEA;EACE,YAAY;EACZ,8DAA8D;EAC9D,qBAAqB;AACvB;;AAEA;EACE,YAAY;EACZ,8DAA8D;EAC9D,qBAAqB;AACvB;;AAEA;EACE,cAAc;EACd,qBAAqB;AACvB;;AAEA;EACE,YAAY;EACZ,8DAA8D;EAC9D,qBAAqB;AACvB;;AAEA;EACE,mBAAmB;EACnB,4BAA4B;AAC9B;;AAEA;EACE;IACE,sBAAsB;IACtB,2CAA2C;EAC7C;;EAEA;IACE,mBAAmB;IACnB,4CAA4C;EAC9C;;EAEA;IACE,sBAAsB;IACtB,2CAA2C;EAC7C;AACF;;AAEA;EACE,8DAA8D;AAChE;;AAEA;EACE,oBAAoB;EACpB,yBAAyB;EACzB,oEAAoE;EACpE,qBAAqB;EACrB,qBAAqB;EACrB,6BAA6B;EAC7B,0BAA0B;EAC1B,oCAAoC;EACpC,iCAAiC;AACnC;;AAEA;EACE,8DAA8D;AAChE;;AAEA;EACE,qDAAqD;EACrD,mCAA2B;UAA3B,2BAA2B;AAC7B;;AAEA;EACE,6BAA6B;EAC7B,YAAY;EACZ,WAAW;EACX,YAAY;EACZ,aAAa;AACf;;AAEA;EACE,gBAAgB;EAChB,WAAW;EACX,cAAc;AAChB;;AAEA;EACE,gBAAgB;EAChB,WAAW;EACX,cAAc;AAChB;;AAEA;EACE,mBAAmB;AACrB;;AAEA;EACE,4BAA4B;EAC5B,2BAA2B;EAC3B,4BAA4B;EAC5B,sBAAsB;AACxB;;AAEA;EACE,sBAAsB;EACtB,4BAA4B;AAC9B;;AAEA;EACE,kBAAkB;EAClB,WAAW;EACX,uBAAuB;EACvB,wBAAwB;EACxB,SAAS;EACT,UAAU;EACV;;;;;;;;GAQC;EACD,0BAA0B;EAC1B,iBAAiB;EACjB,mBAAmB;EACnB,iCAAiC;AACnC;;AAEA;EACE;IACE,8BAA8B;EAChC;EACA;IACE,4BAA4B;EAC9B;EACA;IACE,4BAA4B;EAC9B;EACA;IACE,4BAA4B;EAC9B;EACA;IACE,4BAA4B;EAC9B;EACA;IACE,8BAA8B;EAChC;AACF;;AAEA;EACE;;;;;;GAMC;EACD,mCAA2B;UAA3B,2BAA2B;AAC7B;;AAEA;EACE;;;;;;GAMC;EACD,mCAA2B;UAA3B,2BAA2B;AAC7B","sourcesContent":["html {\n  scroll-behavior: smooth;\n}\n\n.main {\n  min-height: calc(100vh - 128px);\n  margin-top: 64px;\n}\n\n.btn-skewed {\n  display: inline-block;\n  transform: skewX(-0.5rad);\n  border-radius: 8px !important;\n  min-width: 100px !important;\n  padding-left: 20px;\n  padding-right: 20px;\n}\n\n.btn-skewed > a {\n  display: inline-block;\n  transform: skewX(0.5rad);\n  width: 100%;\n}\n\n.centerer {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}\n\n.bar-height {\n  height: 64px;\n}\n\n.taptarget-height {\n  height: 48px;\n}\n\n.rounded-alot {\n  border-radius: 1rem !important;\n}\n\n.rounded-alot-start {\n  border-radius: 1rem 0 0 1rem !important;\n}\n\n.rounded-alot-end {\n  border-radius: 0 1rem 1rem 0 !important;\n}\n\n.rounded-alot-top {\n  border-radius: 1rem 1rem 0 0 !important;\n}\n\n.rounded-alot-bottom {\n  border-radius: 0 0 1rem 1rem !important;\n}\n\n.btn-eboxprimary {\n  color: white;\n  background: linear-gradient(to bottom right, #afd0ff, #dc13af);\n  border-color: #afd0ff;\n}\n\n.btn-eboxprimary:hover {\n  color: white;\n  background: linear-gradient(to bottom right, #7990b0, #8f0d72);\n  border-color: #7990b0;\n}\n\n.btn-outline-eboxprimary {\n  color: #7990b0;\n  border-color: #7990b0;\n}\n\n.btn-outline-eboxprimary:hover {\n  color: white;\n  background: linear-gradient(to bottom right, #afd0ff, #dc13af);\n  border-color: #afd0ff;\n}\n\n.btn-eboxpulser {\n  transform: scale(1);\n  animation: pulse 2s infinite;\n}\n\n@keyframes pulse {\n  0% {\n    transform: scale(0.95);\n    box-shadow: 0 0 0 0 rgba(220, 19, 175, 0.7);\n  }\n\n  70% {\n    transform: scale(1);\n    box-shadow: 0 0 0 10px rgba(220, 19, 175, 0);\n  }\n\n  100% {\n    transform: scale(0.95);\n    box-shadow: 0 0 0 0 rgba(220, 19, 175, 0.7);\n  }\n}\n\n.bg-eboxprimary {\n  background: linear-gradient(to bottom right, #afd0ff, #dc13af);\n}\n\n.text-eboxprimary {\n  line-height: 1.33333;\n  background-color: #afd0ff;\n  background-image: linear-gradient(to bottom right, #afd0ff, #dc13af);\n  background-size: 100%;\n  background-clip: text;\n  -webkit-background-clip: text;\n  -moz-background-clip: text;\n  -webkit-text-fill-color: transparent; \n  -moz-text-fill-color: transparent;\n}\n\n.bg-eboxdark {\n  background: linear-gradient(to bottom right, #2d2f31, #2b1a27);\n}\n\n.bg-lightalpha {\n  background-color: rgba(255, 255, 255, 0.9) !important;\n  backdrop-filter: blur(10px);\n}\n\n.input-nostyle {\n  background-color: transparent;\n  border: none;\n  color: #fff;\n  min-width: 0;\n  outline: none;\n}\n\n.container-small {\n  max-width: 420px;\n  width: 100%;\n  margin: 0 auto;\n}\n\n.container-medium {\n  max-width: 840px;\n  width: 100%;\n  margin: 0 auto;\n}\n\n.mb-alot {\n  margin-bottom: 9rem;\n}\n\n.parallax {\n  background-attachment: fixed;\n  background-position: center;\n  background-repeat: no-repeat;\n  background-size: cover;\n}\n\n.bg-cover {\n  background-size: cover;\n  background-position: 50% 50%;\n}\n\n.highlight {\n  position: absolute;\n  z-index: -1;\n  width: calc(100% + 2px);\n  height: calc(100% + 2px);\n  top: -1px;\n  left: -1px;\n  background: linear-gradient(\n    to left,\n    #fec803 0%,\n    #afd0ff 21.35%,\n    #618fba 47.4%,\n    #7e75a1 65.1%,\n    #dc13af 80.21%,\n    #f61bd3 100%\n  );\n  background-size: 300% 100%;\n  filter: blur(8px);\n  border-radius: 1rem;\n  animation: animate-bg 3s infinite;\n}\n\n@keyframes animate-bg {\n  0% {\n    background-position: 100% 100%;\n  }\n  30% {\n    background-position: 20% 80%;\n  }\n  50% {\n    background-position: 40% 60%;\n  }\n  70% {\n    background-position: 60% 40%;\n  }\n  90% {\n    background-position: 80% 20%;\n  }\n  100% {\n    background-position: 100% 100%;\n  }\n}\n\n.bg-completed {\n  background: repeating-linear-gradient(\n    -55deg,\n    #3a3a3a,\n    #3a3a3a 10px,\n    #2f2f2f 10px,\n    #2f2f2f 20px\n  );\n  backdrop-filter: blur(10px);\n}\n\n.bg-disabled {\n  background: repeating-linear-gradient(\n    -55deg,\n    #fff,\n    #fff 10px,\n    #f8f9fa 10px,\n    #f8f9fa 20px\n  );\n  backdrop-filter: blur(10px);\n}\n"],"sourceRoot":""}]);
// Exports
/* harmony default export */ __webpack_exports__["default"] = (___CSS_LOADER_EXPORT___);


/***/ })

},[[2,"runtime"]]]);
//# sourceMappingURL=styles.js.map