const jQuery = $;

const colors = [
  ["-10000", "#DC143C"],
  [700, "#FF4500"],
  [1200, "#50C878"],
  [1840, "#0F52BA"],
  [1960, "#8F00FF"],
];

const getColor = (year) => {
  let color = "";
  colors.forEach((pair) => {
    const key = parseInt(pair[0]);
    if (year > key) color = pair[1];
  });
  return color;
};

class Symbol {
  constructor(symbolElement) {
    this._jQueryElement = symbolElement;
    let id =
      symbolElement.attr("value") ||
      symbolElement.text().toLowerCase() + "Symbol";

    this._initData(id);
    this._age = 2020 - this._year;
    this._id = id;
    this._original = symbolElement.text();
    this.color = getColor(this._year);
  }
  setColor(color) {
    this._jQueryElement.css("color", color);
  }
  replaceWithAge() {
    this._jQueryElement.text(this._age);
    this._state = "age";
  }
  hideIfOlderThan(value) {
    if (this._age >= parseInt(value)) this.hide();
    else this.show();
  }
  hideIfYoungerThan(value) {
    if (this._age <= parseInt(value)) this.hide();
    else this.show();
  }
  hide() {
    this._jQueryElement.css("opacity", "0");
    const sib = this.getSibling();
    if (!sib || (sib && sib.isHidden()))
      this._jQueryElement.parent().css("opacity", "0");
    this._hidden = true;
  }
  getSibling() {
    // todo: cleanup
    const sib = this._jQueryElement.siblings()[0];
    if (!sib) return undefined;
    const index = parseInt(jQuery(sib).attr("symbol-index"));
    return symbols[index];
  }
  isHidden() {
    return this._hidden === true;
  }
  show() {
    this._jQueryElement.css("opacity", "");
    this._jQueryElement.parent().css("opacity", "");
    this._hidden = false;
  }
  replaceWithYear() {
    const suffix = this._year < 0 ? "BC" : "";
    this._jQueryElement.text(Math.abs(this._year) + suffix);
    this._state = "year";
  }
  replaceWithOriginal() {
    this._jQueryElement.text(this._original);
    this._state = "original";
  }
  getUrl() {
    return this._url;
  }
  _initData(char) {
    // TildaSymbol 1086 https://en.wikipedia.org/wiki/Tilde
    const hit = keyboardTree
      .toString()
      .split("\n")
      .find((line) => line.trim().startsWith(char));
    if (hit) {
      const words = hit.trim().split(" ");
      this._url = words[2];
      this._year = parseInt(words[1].replace("~", ""));
    }
  }
}

const symbols = [];
const main = async () => {
  jQuery(".key").each(function (index, el) {
    jQuery(this)
      .find("span,b")
      .each(function (symbol) {
        jQuery(this).attr("symbol-index", symbols.length);
        const sym = new Symbol(jQuery(this));
        symbols.push(sym);
      });
  });

  let color = "#aaa";
  jQuery("#colorBox").on("change", function () {
    if (color) color = undefined;
    else color = "#aaa";
    symbols.forEach((sym) => sym.setColor(color || sym.color));
  });

  // If someone clicks on a key but not a span or b, click the first child.
  // Ideally we'd just refactor the HTML and change spans and bs to a tags, but
  // no time for that now :)
  jQuery(".key").on("click", function () {
    const firstHit = jQuery(this).find("span,b")[0];
    if (firstHit) jQuery(firstHit).click();
  });
  jQuery(".key span,.key b").on("click", function () {
    const index = parseInt(jQuery(this).attr("symbol-index"));
    const sym = symbols[index];
    window.location = sym.getUrl();
    return false;
  });
  jQuery("#controls a").on("click", function () {
    const command = jQuery(this).attr("value");
    const argIfAny = jQuery(this).attr("data-arg");
    symbols.forEach((sym) => sym[command](argIfAny));
  });
  jQuery("#slider").on("input", function () {
    const year = parseInt(jQuery(this).val());
    const val = 4020 - year;
    symbols.forEach((sym) => sym.hideIfYoungerThan(val));
    jQuery("#sliderOutput").text(year - 2000);
  });
  //symbols.forEach(sym => sym.replaceWithAge())
};

jQuery(document).ready(main);
