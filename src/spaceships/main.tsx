import { h, render } from "preact";
import { AppUi } from "./app-ui";
import { getElement } from "../get-element";
import { App } from "./app";

// https://css-tricks.com/snippets/css/remove-gray-highlight-when-tapping-links-in-mobile-safari/
document.addEventListener("touchstart", () => {}, true);

window.addEventListener('DOMContentLoaded', () => {
  const app = new App(getElement('canvas', '#canvas'));

  app.run();

  render(<AppUi app={app} />, getElement('div', '#app-ui'));
});
