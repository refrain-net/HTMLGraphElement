'use strict';
export class HTMLGraphElement extends HTMLCanvasElement {
  static #vertexShaderSource = 'precision mediump float;' + 
                               '' +
                               'attribute vec4 aVertexColor;' +
                               'attribute vec2 aVertexPosition;' +
                               '' +
                               'varying lowp vec4 vColor;' +
                               '' +
                               'void main () {' +
                               '  gl_Position = vec4(aVertexPosition, 0.0, 1.0);' +
                               '  vColor = aVertexColor;' +
                               '}';
  static #fragmentShaderSource = 'precision mediump float;' +
                                 '' +
                                 'varying lowp vec4 vColor;' +
                                 '' +
                                 'void main () {' +
                                 '  gl_FragColor = vColor;' +
                                 '}';

  #autoClear = false;
  #autoRender = false;
  #elements = [];
  #gl = null;
  #originX = 0;
  #originY = 0;
  #programInfo = {};
  #rangeX = 10;
  #rangeY = 10;

  static get ORIGIN_LEFT () { return 0x0001; }
  static get ORIGIN_RIGHT () { return 0x0002; }
  static get ORIGIN_TOP () { return 0x0004; }
  static get ORIGIN_BOTTOM () { return 0x0008; }
  static get ORIGIN_CENTER () { return 0x0010; }
  static get observedAttributes () {}

  get programInfo () { return this.#programInfo; }

  constructor () {
    super();
    const gl = this.getContext('webgl');
    const program = this.createProgram(gl, HTMLGraphElement.#vertexShaderSource, HTMLGraphElement.#fragmentShaderSource);
    if (program === null) throw new Error();
    gl.useProgram(program);
    this.#gl = gl;
    this.#programInfo = {
      program,
      attribute: {
        vertexColor: gl.getAttribLocation(program, 'aVertexColor'),
        vertexPosition: gl.getAttribLocation(program, 'aVertexPosition')
      }
    };
  }

  adoptedCallback () {}
  attributeChangedCallback (name, oldValue, newValue) {}
  connectedCallback () {}
  disconnectedCallback () {}

  addElement (element) {
    let {color, data} = element;
    color = color.map(currentValue => currentValue / 255);
    data = data.slice();
    this.#elements.push({color, data});
    if (this.#autoRender) this.render();
    return this.#elements.length - 1;
  }
  removeElement (index) {
    this.#elements.splice(index, 1);
    if (this.#autoRender) this.render();
  }

  setAutoClear (autoClear) {
    this.#autoClear = autoClear;
  }
  setAutoRender (autoRender) {
    this.#autoRender = autoRender;
  }
  setOrigin (origin) {
    let originX = 0, originY = 0;
    if ((origin & HTMLGraphElement.ORIGIN_LEFT) !== 0) originX = -1;
    else if ((origin & HTMLGraphElement.ORIGIN_RIGHT) !== 0) originX = 1;
    if ((origin & HTMLGraphElement.ORIGIN_BOTTOM) !== 0) originY = -1;
    else if ((origin & HTMLGraphElement.ORIGIN_TOP) !== 0) originY = 1;
    this.#originX = originX;
    this.#originY = originY;
    if (this.#autoRender) this.render();
  }
  setRange (rangeX, rangeY) {
    this.#rangeX = rangeX;
    this.#rangeY = rangeY;
    if (this.#autoRender) this.render();
  }

  clear () {
    const gl = this.#gl;
    const {height, width} = gl.canvas;
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, width, height);
  }
  draw (gl, array) {
    const {attribute: {vertexColor, vertexPosition}} = this.#programInfo;
    const buffer = this.createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(array));
    const vertexLength = 2; // vec2(x, y)
    const colorLength = 4;  // vec4(r, g, b, a)
    const stride = (vertexLength + colorLength) * Float32Array.BYTES_PER_ELEMENT;
    const positionOffset = 0;
    const colorOffset = vertexLength * Float32Array.BYTES_PER_ELEMENT;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(vertexColor);
    gl.enableVertexAttribArray(vertexPosition);
    gl.vertexAttribPointer(vertexColor, colorLength, gl.FLOAT, false, stride, colorOffset);
    gl.vertexAttribPointer(vertexPosition, vertexLength, gl.FLOAT, false, stride, positionOffset);
    gl.drawArrays(gl.LINE_STRIP, 0, array.length / (vertexLength + colorLength));
    gl.disableVertexAttribArray(vertexColor);
    gl.disableVertexAttribArray(vertexPosition);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.flush();
  }
  render () {
    if (this.#autoClear) this.clear();
    const gl = this.#gl;
    const {attribute: {vertexColor, vertexPosition}} = this.#programInfo;
    const originX = this.#originX;
    const originY = this.#originY;
    const rangeX = this.#rangeX;
    const rangeY = this.#rangeY;
    this.#elements.forEach(({color, data}) => {
      data = data.map((currentValue, index) => index % 2 === 0 ? currentValue * (originX === 0 ? 1 : 2) / rangeX + originX : currentValue * (originY === 0 ? 1 : 2) / rangeY + originY).filter((currentValue, index, array) => Math.abs(array[index - index % 2]) <= 1).reduce((accumulator, currentValue, index) => accumulator.concat(index % 2 === 0 ? currentValue : [currentValue].concat(color)), []);
      this.draw(gl, data);
    });
    this.draw(gl, [originX, -1, 0, 0, 0, 1, originX, 1, 0, 0, 0, 1]);
    this.draw(gl, [-1, originY, 0, 0, 0, 1, 1, originY, 0, 0, 0, 1]);
  }

  createBuffer (gl, type, data) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(type, buffer);
    gl.bufferData(type, data, gl.STATIC_DRAW);
    gl.bindBuffer(type, null);
    return buffer;
  }
  createProgram (gl, vertexShaderSource, fragmentShaderSource) {
    const program = gl.createProgram();
    const vertexShader = this.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
    console.log(gl.getProgramInfoLog(program));
    return null;
  }
  createShader (gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    console.log(gl.getShaderInfoLog(shader));
    return null;
  }
}
customElements.define('x-graph', HTMLGraphElement, {extends: 'canvas'});
