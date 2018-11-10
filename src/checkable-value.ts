/**
 * Convenience class to store a value and detect
 * whether it has changed since the last time
 * we checked.
 */
export class CheckableValue<T> {
  private lastCheckedValue: T|null = null;
  private value: T|null = null;

  /** Set the value. */
  set(value: T) {
    this.value = value;
  }

  /**
   * If the value has changed since the last
   * time we checked, pass it to the given callback
   * function. Otherwise, do nothing.
   */
  check(cb: (value: T) => void) {
    if (this.value === this.lastCheckedValue) {
      return;
    }
    this.lastCheckedValue = this.value;
    if (this.value) {
      cb(this.value);
    }
  }
}
