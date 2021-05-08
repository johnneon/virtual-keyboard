/* eslint-disable import/extensions */
import * as storage from '../utils/storage.js';
import create from '../utils/create.js';
import language from '../languages/index.js';
import Key from './Key.js';

const list = '<li>Tab: <i class="material-icons">keyboard_tab</i></li><li>Enter: <i class="material-icons">keyboard_return</i></li><li>CapsLock<i class="material-icons">keyboard_capslock</i></li><li>Shift: <i class="material-icons">vertical_align_top</i></li><li>Backspace: <i class="material-icons">backspace</i></li><li>Вкл/выкл звук: <i class="material-icons">volume_up</i></li><li>Голосовой ввод: <i class="material-icons">mic</i></li>';
const main = create('main', '',
  [
    create('h1', 'title', 'Virtual Keyboard'),
    create('ul', 'desc__ul', list),
  ]);

const audioContainer = create('div', 'audioset');

export default class Keyboard {
  constructor(rowsOrder) {
    this.switchKeyboard = true;
    this.ternOnKeyboard = true;
    this.rowsOrder = rowsOrder;
    this.keysPressed = {};
    this.isCaps = false;
    this.isShift = false;
    this.isAudio = true;
    this.isVoice = false;
    this.keyBase = language[(storage.get('language')) ? storage.get('language') : 'en'];
  }

  keyboardTern = (event) => {
    if (!event.target.closest('.textarea') && !event.target.closest('.keyboard')) {
      this.switchKeyboard = false;
      this.container.style.bottom = '-100%';
    } else {
      this.switchKeyboard = true;
      this.container.style.bottom = '0%';
    }

    if (event.target.closest('.switcher') && this.switchKeyboard) {
      this.switchKeyboard = false;
      this.container.style.bottom = '-100%';
    } else if (event.target.closest('.switcher') && !this.switchKeyboard) {
      this.switchKeyboard = true;
      this.container.style.bottom = '0%';
    }
  }

  init(langCode) {
    this.keyBase = language[langCode];
    this.switcher = create('button', 'switcher on', 'Virtual-keyboard is On', main);
    this.textarea = create('textarea', 'textarea', null, main,
      ['placeholder', 'Click and type...'],
      ['rows', 5],
      ['cols', 50],
      ['spellcheck', false],
      ['autocorrect', 'off']);
    this.container = create('div', 'keyboard', null, main, ['language', langCode]);
    this.switcher.onclick = () => {
      if (!this.ternOnKeyboard) {
        this.switcher.classList.add('on');
        this.switcher.innerHTML = 'Virtual-keyboard is On';
        this.ternOnKeyboard = true;
        this.container.style.bottom = '0%';
        document.addEventListener('click', this.keyboardTern);
      } else {
        this.switcher.classList.remove('on');
        this.switcher.innerHTML = 'Virtual-keyboard is Off';
        this.ternOnKeyboard = false;
        this.container.style.bottom = '-100%';
        document.removeEventListener('click', this.keyboardTern);
      }
    };

    this.sound(langCode);
    document.body.prepend(main);
    document.addEventListener('click', this.keyboardTern);
    this.container.style.bottom = '-100%';
    return this;
  }

  generateLayout() {
    this.keyButtons = [];
    this.container.innerHTML = '';
    this.rowsOrder.forEach((row, i) => {
      const rowElement = create('div', 'keyboard__row', null, this.container, ['row', i + 1]);
      rowElement.style.gridTemplateColumns = `repeat(${row.length}, 1fr)`;
      row.forEach((code) => {
        const keyObj = this.keyBase.find((key) => key.code === code);
        if (keyObj) {
          const keyButton = new Key(keyObj);
          this.keyButtons.push(keyButton);
          rowElement.append(keyButton.button);
        }
      });
    });

    document.addEventListener('keydown', this.handleEvent);
    document.addEventListener('keyup', this.handleEvent);

    this.container.addEventListener('mousedown', this.preHandleEvent);
    this.container.addEventListener('mouseup', this.preHandleEvent);
  }

  voiceInput = () => {
    if (!window.SpeechRecognition) {
      if (!window.webkitSpeechRecognition) {
        // eslint-disable-next-line no-alert
        alert("SpeechRecognition doesn't work in this browser :(");
        return;
      }
    }
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    // eslint-disable-next-line no-undef
    const recognition = new SpeechRecognition();
    recognition.interimResults = true;
    recognition.lang = (storage.get('language')) ? storage.get('language') : 'en';
    recognition.addEventListener('result', this.voiceText);
    if (this.isVoice) {
      recognition.start();
    } else {
      recognition.stop();
    }
  }

  voiceText = (event) => {
    let sentence = '';
    const input = this.textarea.value.slice();
    const transcript = Array.from(event.results)
      .map((result) => result[0])
      .map((result) => result.transcript)
      .join(' ');
    sentence = transcript;
    if (event.results[0].isFinal && !input) {
      this.textarea.value = `${sentence}`;
      this.voiceInput();
    } else if (event.results[0].isFinal && input) {
      this.textarea.value = `${input} ${sentence}`;
      this.voiceInput();
    }
  }

  sound = (lang) => {
    const sounds = {
      Key: `./assets/audio/${lang}/key.mp3`,
      Caps: `./assets/audio/${lang}/caps.mp3`,
      Backspace: `./assets/audio/${lang}/back.mp3`,
      Enter: `./assets/audio/${lang}/enter.mp3`,
      Shift: `./assets/audio/${lang}/shift.mp3`,
      Space: `./assets/audio/${lang}/space.mp3`,
    };
    audioContainer.innerHTML = '';
    this.soundsBox = [];

    Object.keys(sounds).forEach((sound) => {
      const audio = document.createElement('audio');
      audio.src = sounds[sound];
      audio.setAttribute('data-key', sound);
      this.soundsBox.push(audio);
      audioContainer.append(audio);
    });
    main.append(audioContainer);
  }

  preHandleEvent = (event) => {
    event.stopPropagation();
    const keyBtn = event.target.closest('.k-key');
    if (!keyBtn) return;
    const { dataset: { code } } = keyBtn;
    keyBtn.addEventListener('mouseleave', this.resetButtonState);
    this.handleEvent({ code, type: event.type });
  }

  resetButtonState = ({ target: { dataset: { code } } }) => {
    const keyObj = this.keyButtons.find((key) => key.code === code);
    if (!code.match(/Caps/) || code.match(/Shift/)) keyObj.button.classList.remove('holding');
    keyObj.button.removeEventListener('mouseleave', this.resetButtonState);
  }

  handleEvent = (event) => {
    if (!this.switchKeyboard) return;
    if (event.stopPropagation) event.stopPropagation();
    const { code, type } = event;
    const keyObj = this.keyButtons.find((key) => key.code === code);
    if (!keyObj) return;
    this.textarea.focus();

    if (type.match(/keydown|mousedown/)) {
      if (type.match(/key/)) event.preventDefault();

      keyObj.button.classList.add('holding');

      if (code.match(/AltRight/) && this.isAudio) {
        this.isAudio = false;
        keyObj.button.classList.add('off');
      } else if (code.match(/AltRight/) && !this.isAudio) {
        this.isAudio = true;
        keyObj.button.classList.remove('off');
      }

      // todo Audio
      if (this.isAudio) {
        if (code.match(/Caps/)) {
          this.soundsBox[1].currentTime = 0;
          this.soundsBox[1].play();
        } else if (code.match(/Backspace/)) {
          this.soundsBox[2].currentTime = 0;
          this.soundsBox[2].play();
        } else if (code.match(/Enter/)) {
          this.soundsBox[3].currentTime = 0;
          this.soundsBox[3].play();
        } else if (code.match(/Shift/)) {
          this.soundsBox[4].currentTime = 0;
          this.soundsBox[4].play();
        } else if (code.match(/Space/)) {
          this.soundsBox[5].currentTime = 0;
          this.soundsBox[5].play();
        } else if (!code.match(/ControlLeft/)) {
          this.soundsBox[0].currentTime = 0;
          this.soundsBox[0].play();
        }
      }

      // todo Caps down
      if (code.match(/Caps/) && !this.isCaps) {
        this.isCaps = true;
        this.switchUpperCase(true);
        keyObj.button.classList.add('on');
      } else if (code.match(/Caps/) && this.isCaps) {
        this.isCaps = false;
        this.switchUpperCase(false);
        keyObj.button.classList.remove('on');
        keyObj.button.classList.remove('holding');
      }

      // todo Voice input
      if (code.match(/AltLeft/) && !this.isVoice) {
        this.isVoice = true;
        this.voiceInput();
        keyObj.button.classList.add('on');
      } else if (code.match(/AltLeft/) && this.isVoice) {
        this.isVoice = false;
        this.voiceInput();
        keyObj.button.classList.remove('on');
        keyObj.button.classList.remove('holding');
      }

      // todo Press shift
      if (code.match(/Shift/) && !this.isShift) {
        this.isShift = true;
        this.shiftKey = true;
        this.switchUpperCase(true);
        keyObj.button.classList.add('on');
        keyObj.button.classList.add('holding');
      } else if (code.match(/Shift/) && this.isShift) {
        this.isShift = false;
        this.shiftKey = false;
        // todo Solte shift
        this.switchUpperCase(false);
        keyObj.button.classList.remove('on');
        keyObj.button.classList.remove('holding');
      }

      // todo Switch language
      if (code.match(/ControlLeft/)) this.switchLangeage();

      // todo Print
      if (!this.isCaps) {
        this.printToOutput(keyObj, this.shiftKey ? keyObj.shift : keyObj.small);
      } else if (this.isCaps) {
        if (this.shiftKey) {
          this.printToOutput(keyObj, keyObj.sub.innerHTML ? keyObj.shift : keyObj.small);
        } else {
          this.printToOutput(keyObj, !keyObj.sub.innerHTML ? keyObj.shift : keyObj.small);
        }
      }
    // Realease button
    } else if (type.match(/keyup|mouseup/)) {
      keyObj.button.classList.remove('holding');

      // todo Caps down
      if (type.match(/keyup/) && code.match(/Caps/)) {
        if (code.match(/Caps/) && !this.isCaps) {
          this.isCaps = true;
          this.switchUpperCase(true);
          keyObj.button.classList.add('on');
          keyObj.button.classList.add('holding');
        } else if (code.match(/Caps/) && this.isCaps) {
          this.isCaps = false;
          this.switchUpperCase(false);
          keyObj.button.classList.remove('on');
          keyObj.button.classList.remove('holding');
        }
      }

      if (type.match(/mouseup/) && code.match(/Caps/)) {
        if (this.isCaps) {
          keyObj.button.classList.add('holding');
        } else {
          keyObj.button.classList.remove('holding');
        }
      }
    }
  }

  switchLangeage = () => {
    const langAbbr = Object.keys(language);
    let langIndex = langAbbr.indexOf(this.container.dataset.language);
    this.keyBase = langIndex + 1 < langAbbr.length ? language[langAbbr[langIndex += 1]]
      : language[langAbbr[langIndex -= langIndex]];
    this.sound(langAbbr[langIndex]);
    this.container.dataset.language = langAbbr[langIndex];
    storage.set('language', langAbbr[langIndex]);
    this.isCaps = false;
    this.isShift = false;
    this.isAudio = true;
    this.isVoice = false;
    this.generateLayout();
    this.switchUpperCase(false);
    this.voiceInput();
  }

  switchUpperCase(isTrue) {
    if (isTrue) {
      this.keyButtons.forEach((button) => {
        if (button.sub) {
          if (this.shiftKey && !button.isFnKey) {
            button.sub.classList.add('sub-active');
            button.letter.classList.add('sub-inactive');
          }
        }

        if (!button.isFnKey && this.isCaps && !this.shiftKey && !button.sub.innerHTML) {
          // eslint-disable-next-line no-param-reassign
          button.letter.innerHTML = button.shift;
        } else if (!button.isFnKey && this.isCaps && this.shiftKey) {
          // eslint-disable-next-line no-param-reassign
          button.letter.innerHTML = button.small;
        } else if (!button.isFnKey && !button.sub.innerHTML) {
          // eslint-disable-next-line no-param-reassign
          button.letter.innerHTML = button.shift;
        }
      });
    } else {
      this.keyButtons.forEach((button) => {
        button.sub.classList.remove('sub-active');
        button.letter.classList.remove('sub-inactive');
        if (button.sub.innerHTML && !button.isFnKey) {
          if (!this.isCaps) {
            // eslint-disable-next-line no-param-reassign
            button.letter.innerHTML = button.small;
          } else if (!this.isCaps) {
            // eslint-disable-next-line no-param-reassign
            button.letter.innerHTML = button.shift;
          }
        } else if (!button.isFnKey) {
          if (this.isCaps) {
            // eslint-disable-next-line no-param-reassign
            button.letter.innerHTML = button.shift;
          } else {
            // eslint-disable-next-line no-param-reassign
            button.letter.innerHTML = button.small;
          }
        }
      });
    }
  }

  printToOutput(keyObj, symbol) {
    let cursorPos = this.textarea.selectionStart;
    const left = this.textarea.value.slice(0, cursorPos);
    const right = this.textarea.value.slice(cursorPos);

    const fnButtonsHandler = {
      Tab: () => {
        this.textarea.value = `${left}\t${right}`;
        cursorPos += 1;
      },
      ArrowLeft: () => {
        cursorPos = cursorPos - 1 >= 0 ? cursorPos - 1 : 0;
      },
      ArrowRight: () => {
        cursorPos += 1;
      },
      ArrowUp: () => {
        const positionFromLeft = this.textarea.value.slice(0, cursorPos).match(/(\n).*$(?!\1)/g) || [[1]];
        cursorPos -= positionFromLeft[0].length;
      },
      ArrowDown: () => {
        const positionFromLeft = this.textarea.value.slice(cursorPos).match(/^.*(\n).*(?!\1)/) || [[1]];
        cursorPos += positionFromLeft[0].length;
      },
      Enter: () => {
        this.textarea.value = `${left}\n${right}`;
        cursorPos += 1;
      },
      Delete: () => {
        this.textarea.value = `${left}${right.slice(1)}`;
      },
      Backspace: () => {
        this.textarea.value = `${left.slice(0, -1)}${right}`;
        cursorPos -= 1;
      },
      Space: () => {
        this.textarea.value = `${left} ${right}`;
        cursorPos += 1;
      },
    };

    if (fnButtonsHandler[keyObj.code]) {
      fnButtonsHandler[keyObj.code]();
    } else if (!keyObj.isFnKey) {
      cursorPos += 1;
      this.textarea.value = `${left}${symbol || ''}${right}`;
    }
    this.textarea.setSelectionRange(cursorPos, cursorPos);
  }
}
