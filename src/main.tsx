import { h, render } from "preact";
import { AppUi } from "./app-ui";
import { getElement } from "./get-element";
import { App } from "./app";

window.addEventListener('DOMContentLoaded', () => {
  const app = new App(getElement('canvas', '#canvas'));

  app.run();

  render(<AppUi app={app} />, getElement('div', '#app-ui'));
});
