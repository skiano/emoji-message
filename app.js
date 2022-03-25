////////////
// CANVAS //
////////////

const scale = window.devicePixelRatio; // Change to 1 on retina screens to see blurry canvas.
const canvasWrapElm = document.getElementById('canvas');
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d', { alpha: false });
ctx.scale(scale, scale); // Normalize coordinate system to use css pixels.
canvasWrapElm.appendChild(canvas);

canvas.width = 400;
canvas.height = 400;

////////////
// EDITOR //
////////////

const EDITOR = document.getElementById('editor');
const LINES = [];
const FONTS = [
  'Helvetica',
  'Times New Roman',
];

function create(tag, attr = {}, children = []) {
  children = Array.isArray(children) ? children : [children];
  const elm = document.createElement(tag);
  for (let a in attr) {
    if (a.startsWith('on')) {
      elm.addEventListener(a.slice(2).toLowerCase(), attr[a])
    } else {
      if (attr[a]) elm.setAttribute(a, attr[a]);
    }
  }
  children.forEach((c) => {
    if (typeof c === 'string') {
      elm.innerText = c;
    } else {
      elm.appendChild(c);
    }
  });
  return elm;
};

const addLine = (props, insertAt = 0) => {
  const line = {};
  const computeSize = (s) => s + 'px';

  props = new Proxy({
    txt: '',
    size: 24,
    font: FONTS[0],
    ...props,
  }, {
    set(o, k, v) {
      if (k === 'size') line.preview.style.fontSize = computeSize(v);
      if (k === 'font') line.preview.style.fontFamily = v;
      o[k] = v;
    },
  });

  line.props = props;

  const handleTxtChange = (evt) => {
    props.txt = evt.target.innerText;
  };

  line.preview = create('p', {
    class: 'text-field',
    contenteditable: true,
    style: `font-family: ${props.font}; font-size: ${computeSize(props.size)}`,
    onBlur: handleTxtChange,
    onKeyup: handleTxtChange,
    onPaste: handleTxtChange,
    onKeydown: (evt) => {
      if (evt.key === 'Backspace' && LINES.length > 1 && getCarrotPosition() === 0) {
        evt.preventDefault();

        const idx = LINES.indexOf(line);
        const nextLine = LINES[idx > 0 ? idx - 1 : 1];
        const [_, after] = getTextBeforeAndAfter(evt.target);
        
        if (after) {
          nextLine.props.txt = `${nextLine.props.txt} ${after}`;
          nextLine.preview.innerText = nextLine.props.txt;
        }

        line.wrap.remove();
        LINES.splice(idx, 1);

        // TODO: place the caret in the middle when delete brings old text with it...
        placeCaret(nextLine.preview);
      } else if (evt.key === 'Enter') {
        evt.preventDefault();
        const [before, after] = getTextBeforeAndAfter(evt.target);
        line.preview.innerText = before;
        props.txt = before;
        addLine({
          ...props,
          txt: after.trim(), // important that there is a space...
        }, LINES.indexOf(line));
      };
    },
  }, props.txt);

  line.wrap = create('div', { class: 'message-line' }, [
    line.preview,
    create('div', { class: 'line-options' }, [
      create('select', {
        class: 'option',
        onChange: (evt) => {
          props.font = evt.target.value;
        }
      }, FONTS.map((f) => {
        return create('option', { selected: f === props.font }, f);
      })),
      create('input', {
        class: 'option',
        type: 'number',
        min: 10,
        max: 60,
        value: props.size,
        onChange: (evt) => {
          props.size = evt.target.value;
        }
      })
    ])
  ]);

  LINES.splice(insertAt + 1, 0, line);
  EDITOR.insertBefore(line.wrap, EDITOR.children[insertAt + 1]);
  placeCaret(line.preview, true);
}

addLine({
  txt: 'Try Me...',
});

// https://stackoverflow.com/a/4238971
function placeCaret(el, atBeginning) {
  el.focus();
  const range = document.createRange();
  range.selectNodeContents(el.childNodes.length ? el.childNodes[0] : el); // HACK: using the child node so we get the correct caret position after the focus
  range.collapse(atBeginning);

  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function getCarrotPosition() {
  sel = window.getSelection();
  range = sel.getRangeAt(0);
  return range.endOffset;
};

function getTextBeforeAndAfter(el) {
  caretPos = getCarrotPosition();
  return [el.innerText.slice(0, caretPos), el.innerText.slice(caretPos)];
};