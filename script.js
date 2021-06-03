'use strict';

// import {HTMLGraphElement} from './HTMLGraphElement.js';

const graph = document.querySelector('#graph');
const rangeX = 10;
const rangeY = 10;

console.time('render');

graph.setAutoRender(true);
graph.setOrigin(0b1001);
graph.setRangeX(0, rangeX);
graph.setRangeY(0, rangeY);
graph.setRange(20, 10);

const data = [];
for (let i = 0; i <= rangeX * 100; i += 0.01) {
  data.push(i);
  data.push(Math.random() * rangeY);
}
graph.addElement({color: [255, 0, 0, 255], data});

console.timeEnd('render');
