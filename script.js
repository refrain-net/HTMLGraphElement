'use strict';

import HTMLGraphElement from './HTMLGraphElement.js';

const graph = document.querySelector('#graph');
const rangeX = 100000;
const rangeY = 100;

console.time('render');

graph.setAutoRender(true);
graph.setOrigin(HTMLGraphElement.ORIGIN_CENTER | HTMLGraphElement.ORIGIN_CENTER);
graph.setRange(rangeX, rangeY);

const data = [];
for (let i = -rangeX; i <= rangeX; i ++) {
  data.push(i);
  data.push(Math.random() * rangeY * (Math.random() < 0.5 ? 1 : -1));
}
graph.addElement({color: [255, 0, 0, 255], data});

data.length = 0;
for (let i = -rangeX; i <= rangeX; i ++) {
  data.push(i);
  data.push(Math.random() * rangeY / 2 * (Math.random() < 0.5 ? 1 : -1));
}
graph.addElement({color: [0, 255, 0, 255], data});

console.timeEnd('render');
