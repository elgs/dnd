import { ui, dndEvent, dndState } from './lib.js';
import { Draggable } from './draggable.js';
import { Droppable } from './droppable.js';

export { dndEvent, dndState };
export const makeDraggable = (domElement, options, parent = null) => ui(Draggable, domElement, options, parent);
export const makeDroppable = (domElement, options, parent = null) => ui(Droppable, domElement, options, parent);