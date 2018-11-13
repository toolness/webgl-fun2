import { h, Component } from "preact";

type KeyboardMapHandler = () => void;

export class KeyboardMap {
  mapping: Map<string, KeyboardMapHandler> = new Map();

  constructor() {
    document.body.addEventListener('keypress', e => this.handleEvent(e));
  }

  private handleEvent(e: KeyboardEvent) {
    const handler = this.mapping.get(e.key.toLowerCase());
    if (handler) {
      handler();
    }
  }

  set(key: string, handler: KeyboardMapHandler) {
    this.mapping.set(key, handler);
  }

  unset(key: string) {
    this.mapping.delete(key);
  }
}

const globalKeyboardMapping = new KeyboardMap();

interface HotkeyProps {
  hotkey: string;
  onPressed: KeyboardMapHandler;
}

export class Hotkey extends Component<HotkeyProps> {
  handlePress() {
    this.props.onPressed();
  }

  componentDidMount() {
    globalKeyboardMapping.set(this.props.hotkey, this.handlePress.bind(this));
  }

  componentWillUnmount() {
    globalKeyboardMapping.unset(this.props.hotkey);
  }

  render(props: HotkeyProps) {
    return <kbd>{props.hotkey}</kbd>;
  }
}
