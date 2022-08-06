import { settings } from './_build/DarkPlasma_CustomTextOutline_parameters';

/**
 * @param {Bitmap.prototype} bitmap
 */
function Bitmap_CustomTextOutlineMixIn(bitmap) {
  const _initialize = bitmap.initialize;
  bitmap.initialize = function (width, height) {
    _initialize.call(this, width, height);
    this.outlineColor = `rgba(${settings.color.red}, ${settings.color.blue}, ${settings.color.green}, ${settings.color.alpha})`;
    this.outlineWidth = settings.width;
  };
}

Bitmap_CustomTextOutlineMixIn(Bitmap.prototype);
