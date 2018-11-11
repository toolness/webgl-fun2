type KeyboardMapHandler = () => void;

export class KeyboardMap {
  mapping: Map<string, KeyboardMapHandler> = new Map();

  constructor() {
    document.body.addEventListener('keypress', e => this.handleEvent(e));
  }

  private addKbdElement(key: string, el: Node) {
    const kbd = document.createElement('kbd');
    kbd.textContent = key;
    el.appendChild(document.createTextNode(' '));
    el.appendChild(kbd);
  }

  private handleEvent(e: KeyboardEvent) {
    const handler = this.mapping.get(e.key.toLowerCase());
    if (handler) {
      handler();
    }
  }

  set(key: string, handler: KeyboardMapHandler, labelNode?: Node|null) {
    this.mapping.set(key, handler);
    if (labelNode) {
      this.addKbdElement(key, labelNode);
    }
  }

  setCheckboxToggler(key: string, el: HTMLInputElement) {
    this.set(key, checkboxToggler(el), el.parentNode);
  }
}

function checkboxToggler(el: HTMLInputElement): KeyboardMapHandler {
  return () => el.checked = !el.checked;
}
