/* eslint-disable import/extensions */
import create from '../utils/create.js';
import * as storage from '../utils/storage.js';

export default class Key {
  constructor({ small, shift, code }) {
    this.small = small;
    this.shift = shift;
    this.code = code;
    this.isFnKey = Boolean(small.match(/ |Sound|Voice|Lang|Ctrl|arr|Alt|Shift|Tab|Back|Del|Enter|Caps|Win/));
    if (shift && shift.match(/[^a-zA-Zа-яА-ЯёË0-9]/)) {
      this.sub = create('div', 'sub', this.shift);
    } else {
      this.sub = create('div', 'sub', '');
    }
    if (small.match(/[^a-zA-Zа-яА-ЯёË]/)) {
      this.isLetter = 'character';
    } else {
      this.isLetter = 'letter';
    }

    if (small.match(/Lang/)) {
      // eslint-disable-next-line no-param-reassign
      small = (storage.get('language')) ? storage.get('language').toUpperCase() : 'EN';
    } else if (small.match(/Voice/)) {
      // eslint-disable-next-line no-param-reassign
      small = create('i', 'material-icons', 'mic');
    } else if (code.match(/Space/)) {
      // eslint-disable-next-line no-param-reassign
      small = create('i', 'material-icons', 'space_bar');
    } else if (code.match(/Enter/)) {
      // eslint-disable-next-line no-param-reassign
      small = create('i', 'material-icons', 'keyboard_return');
    } else if (code.match(/Backspace/)) {
      // eslint-disable-next-line no-param-reassign
      small = create('i', 'material-icons', 'backspace');
    } else if (code.match(/Caps/)) {
      // eslint-disable-next-line no-param-reassign
      small = create('i', 'material-icons', 'keyboard_capslock');
    } else if (code.match(/Tab/)) {
      // eslint-disable-next-line no-param-reassign
      small = create('i', 'material-icons', 'keyboard_tab');
    } else if (code.match(/Shift/)) {
      // eslint-disable-next-line no-param-reassign
      small = create('i', 'material-icons', 'vertical_align_top');
    } else if (code.match(/AltRight/)) {
      // eslint-disable-next-line no-param-reassign
      small = create('i', 'material-icons', 'volume_up');
    }

    this.letter = create('div', this.isLetter, small);
    this.button = create('button', 'k-key', [this.sub, this.letter], null, ['code', this.code],
      this.isFnKey ? ['fn', 'true'] : ['fn', 'false']);
  }
}
