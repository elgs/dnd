import { ui, dndEvent, dndState } from './lib.js';
import { Draggable } from './draggable.js';
import { Droppable } from './droppable.js';
import { Resizable } from './resizable.js';
import { Sortable } from './sortable.js';
import { Layout } from './layout.js';
import { RightClick } from './rightclick.js';
import { ContextMenu } from './contextmenu.js';
import { DoubleClick } from './doubleclick.js';

export { dndEvent, dndState };
export const makeDraggable = (domElement, options, parent = null) => ui(Draggable, domElement, options, parent);
export const makeDroppable = (domElement, options, parent = null) => ui(Droppable, domElement, options, parent);
export const makeResizable = (domElement, options, parent = null) => ui(Resizable, domElement, options, parent);
export const makeSortable = (domElement, options, parent = null) => ui(Sortable, domElement, options, parent);
export const makeLayout = (domElement, options, parent = null) => ui(Layout, domElement, options, parent);
export const makeRightClick = (domElement, options, parent = null) => ui(RightClick, domElement, options, parent);
export const makeContextMenu = (domElement, options, parent = null) => ui(ContextMenu, domElement, options, parent);
export const makeDoubleClick = (domElement, options, parent = null) => ui(DoubleClick, domElement, options, parent);