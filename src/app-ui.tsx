import { h, Component } from 'preact';
import { App } from './app';
import { Hotkey } from './keyboard';

interface CheckboxProps {
  label: string;
  checked: boolean;
  onToggle: (newValue: boolean) => void;
  hotkey?: string;
}

function Checkbox(props: CheckboxProps): JSX.Element {
  const handleToggle = () => props.onToggle(!props.checked);

  return (
    <label>
      <input type="checkbox"
            checked={props.checked}
            onClick={handleToggle} /> {props.label}{' '}
      {props.hotkey && <Hotkey onPressed={handleToggle} hotkey={props.hotkey} />}
    </label>
  );
}

interface AppUiProps {
  app: App
}

export type AppUiState = {
  showColliders: boolean;
  isPaused: boolean;
  showZBuffer: boolean;
  enableLighting: boolean;
};

export class AppUi extends Component<AppUiProps, AppUiState> {
  constructor(props: AppUiProps) {
    super(props);
    this.state = props.app.getUi();
  }

  componentDidUpdate() {
    this.props.app.dispatchAction({ type: 'uiupdate', ui: this.state });
  }

  render(props: AppUiProps, state: AppUiState): JSX.Element {
    return (
      <div className="ui-wrapper">
        <div className="ui">
          <Checkbox checked={state.showColliders}
                    label="Show colliders"
                    hotkey="c"
                    onToggle={showColliders => this.setState({ showColliders })} />
          <Checkbox checked={state.isPaused}
                    label="Pause"
                    hotkey="p"
                    onToggle={isPaused => this.setState({ isPaused })} />
          <Checkbox checked={state.showZBuffer}
                    label="Show z-buffer"
                    hotkey="z"
                    onToggle={showZBuffer => this.setState({ showZBuffer })} />
          {!state.showZBuffer &&
            <Checkbox checked={state.enableLighting}
                      label="Enable lighting"
                      hotkey="l"
                      onToggle={enableLighting => this.setState({ enableLighting })} />}
        </div>
      </div>
    );
  }
}
