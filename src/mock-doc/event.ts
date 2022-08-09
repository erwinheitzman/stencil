import { MockDocument } from './document';
import { MockElement } from './node';
import { NODE_NAMES } from './constants';

export class MockEvent {
  bubbles = false;
  cancelBubble = false;
  cancelable = false;
  composed = false;
  currentTarget: MockElement = null;
  defaultPrevented = false;
  srcElement: MockElement = null;
  target: MockElement = null;
  timeStamp: number;
  type: string;

  // KeyboardEvent properties
  code?: string;
  key?: string;
  location?: number;
  repeat?: boolean;

  // MouseEvent properties
  screenX?: number;
  screenY?: number;
  clientX?: number;
  clientY?: number;
  button?: number;
  buttons?: number;
  relatedTarget?: EventTarget;

  // KeyboardEvent and MouseEvent properties
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;

  // CustomEvent properties
  detail?: any;

  constructor(type: string, eventInitDict?: EventInit) {
    if (typeof type !== 'string') {
      throw new Error(`Event type required`);
    }
    this.type = type;
    this.timeStamp = Date.now();

    if (eventInitDict != null) {
      Object.assign(this, eventInitDict);
    }
  }

  preventDefault() {
    this.defaultPrevented = true;
  }

  stopPropagation() {
    this.cancelBubble = true;
  }

  stopImmediatePropagation() {
    this.cancelBubble = true;
  }

  composedPath(): MockElement[] {
    const composedPath: MockElement[] = [];

    let currentElement = this.target;

    while (currentElement) {
      composedPath.push(currentElement);

      if (!currentElement.parentElement && currentElement.nodeName === NODE_NAMES.DOCUMENT_NODE) {
        // the current element doesn't have a parent, but we've detected it's our root document node. push the window
        // object associated with the document onto the path
        composedPath.push((currentElement as MockDocument).defaultView);
        break;
      }

      currentElement = currentElement.parentElement;
    }

    return composedPath;
  }
}

export class MockCustomEvent extends MockEvent {
  constructor(type: string, customEventInitDic?: CustomEventInit) {
    super(type);

    super.detail = null;

    if (customEventInitDic != null) {
      Object.assign(this, customEventInitDic);
    }
  }
}

export class MockKeyboardEvent extends MockEvent {
  constructor(type: string, keyboardEventInitDic?: KeyboardEventInit) {
    super(type);

    super.code = '';
    super.key = '';
    super.altKey = false;
    super.ctrlKey = false;
    super.metaKey = false;
    super.shiftKey = false;
    super.location = 0;
    super.repeat = false;

    if (keyboardEventInitDic != null) {
      Object.assign(this, keyboardEventInitDic);
    }
  }
}

export class MockMouseEvent extends MockEvent {
  constructor(type: string, mouseEventInitDic?: MouseEventInit) {
    super(type);

    super.screenX = 0;
    super.screenY = 0;
    super.clientX = 0;
    super.clientY = 0;
    super.ctrlKey = false;
    super.shiftKey = false;
    super.altKey = false;
    super.metaKey = false;
    super.button = 0;
    super.buttons = 0;
    super.relatedTarget = null;

    if (mouseEventInitDic != null) {
      Object.assign(this, mouseEventInitDic);
    }
  }
}

export class MockEventListener {
  type: string;
  handler: (ev?: any) => void;

  constructor(type: string, handler: any) {
    this.type = type;
    this.handler = handler;
  }
}

export function addEventListener(elm: any, type: string, handler: any) {
  const target: EventTarget = elm;

  if (target.__listeners == null) {
    target.__listeners = [];
  }

  target.__listeners.push(new MockEventListener(type, handler));
}

export function removeEventListener(elm: any, type: string, handler: any) {
  const target: EventTarget = elm;

  if (target != null && Array.isArray(target.__listeners) === true) {
    const elmListener = target.__listeners.find((e) => e.type === type && e.handler === handler);
    if (elmListener != null) {
      const index = target.__listeners.indexOf(elmListener);
      target.__listeners.splice(index, 1);
    }
  }
}

export function resetEventListeners(target: any) {
  if (target != null && (target as EventTarget).__listeners != null) {
    (target as EventTarget).__listeners = null;
  }
}

function triggerEventListener(elm: any, ev: MockEvent) {
  if (elm == null || ev.cancelBubble === true) {
    return;
  }

  const target: EventTarget = elm;
  ev.currentTarget = elm;

  if (Array.isArray(target.__listeners) === true) {
    const listeners = target.__listeners.filter((e) => e.type === ev.type);
    listeners.forEach((listener) => {
      try {
        listener.handler.call(target, ev);
      } catch (err) {
        console.error(err);
      }
    });
  }

  if (ev.bubbles === false) {
    return;
  }

  if (elm.nodeName === NODE_NAMES.DOCUMENT_NODE) {
    triggerEventListener((elm as MockDocument).defaultView, ev);
  } else {
    triggerEventListener(elm.parentElement, ev);
  }
}

export function dispatchEvent(currentTarget: any, ev: MockEvent) {
  ev.target = currentTarget;
  triggerEventListener(currentTarget, ev);
  return true;
}

export interface EventTarget {
  __listeners: MockEventListener[];
}
