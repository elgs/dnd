import { makeDraggable, makeDroppable } from './az.js';
import * as azdom from './lib.js';

export class Sortable {
   static id = 'azui-sortable';
   static settings = {
      placeholder: true,
      showPlaceHolder: false,
      detachable: false,
      align: 'x', // or y
      create: function (event, ui) {
         // console.log('create');
      },
      start: function (event, ui) {
         // console.log('start');
      },
      enter: function (event, ui) { },
      exit: function (event, ui) { },
      sort: function (event, data) {
         // console.log('sort', data);
      },
      sorted: function (event, data) {
         // console.log('sorted', data);
      },
      stop: function (event, data) {
         // console.log('stop', data);
      },
      add: function (event, data) {
         // console.log('add', data);
      },
   };

   init() {

      const me = this;
      const settings = me.settings;
      const dom = me.dom;
      this.z = 0;

      if (settings.detachable) {
         makeDroppable(dom, {
            interestedDropEvents: azdom.dndEvent.pointer_in | azdom.dndEvent.pointer_out,
            pointer_in: function (e) {
               // console.log('pointer in fired');
               const source = e.detail.source;
               if (!source.classList.contains('azSortableItem')) {
                  return;
               }

               source.classList.add('az-sortable-moving');

               const draggable = makeDraggable(source);
               const droppable = makeDroppable(source);
               if (draggable.sortContainer.settings.placeholder !== me.settings.placeholder) {
                  return;
               }
               me.settings.enter.call(me, e, me);
               draggable.sortContainer = me;
               droppable.sortContainer = me;
               const detachedContainer = draggable.detachedContainer;
               if (!detachedContainer) {
                  return;
               }
               me.selected = source;
               const phs = azdom.siblings(source, '.az-placeholder');
               if (phs.length > 0) {
                  me.ph = phs[0];
               }
               const ptrEvt = e.detail.originalEvent;
               const cursorX = ptrEvt.pageX ?? ptrEvt.touches[0].pageX;
               const cursorY = ptrEvt.pageY ?? ptrEvt.touches[0].pageY;

               // otherwise, the dragged in elem flickers on drag in.
               source.style.visibility = 'hidden';
               me.add(source, cursorX, cursorY);

               if (me.ph) {
                  const diffContainer = azdom.diffPositionInnerBorder(me.dom, detachedContainer.dom);
                  // console.log(me.dom, detachedContainer.dom);

                  draggable.mouseX0 += diffContainer.left;
                  draggable.mouseY0 += diffContainer.top;
                  // console.log(draggable.mouseX0, draggable.mouseY0);

                  azdom.insertBefore(me.ph, source);
               } else {
                  // console.log(draggable.originalBpr);
                  me.selected.style.top = '';
                  me.selected.style.left = '';
                  me.selected.style.right = '';
                  me.selected.style.bottom = '';

                  const bcr = me.selected.getBoundingClientRect();
                  const bpr = {
                     top: bcr.top + azdom.getDocScrollTop(),
                     left: bcr.left + azdom.getDocScrollLeft()
                  };

                  const diffDraggable = {
                     top: bpr.top - draggable.originalBpr.top,
                     left: bpr.left - draggable.originalBpr.left
                  };

                  draggable.mouseX0 += diffDraggable.left;
                  draggable.mouseY0 += diffDraggable.top;
                  draggable.setContainment(me.dom);
                  // console.log(diffDraggable);
                  // console.log(draggable.mouseX0, draggable.mouseY0);
                  draggable.originalBpr = bpr;
               }

               draggable.detachedX = false;
               draggable.detachedY = false;

               setTimeout(() => {
                  // don't trigger on target center event until 50ms later.
                  source.classList.remove('az-sortable-moving');
                  source.style.visibility = 'visible';
               }, 50);
            },
            pointer_out: function (e) {
               // console.log('pointer out fired');
               if (!me.selected) {
                  return;
               }
               me.settings.exit.call(me, e, me);
               const source = e.detail.source;
               if (!source.classList.contains('azSortableItem')) {
                  return;
               }
               source.classList.add('az-sortable-moving');
               // console.log(me.selected);
               const draggable = makeDraggable(me.selected);
               draggable.detachedX = true;
               draggable.detachedY = true;

               draggable.detachedContainer = me;
               draggable.originalContainer ??= me;
            }
         });
      }

      const items = Array.prototype.filter.call(dom.children, n => azdom.matches(n, '.azSortableItem:not(.az-placeholder)'));
      items.forEach(item => {
         const draggable = makeDraggable(item, me.dragConfig);
         const droppable = makeDroppable(item, me.dropConfig);
         draggable.sortContainer = me;
         droppable.sortContainer = me;
      });
   }

   add(elem, cursorX = Number.MAX_SAFE_INTEGER, cursorY = Number.MAX_SAFE_INTEGER) {
      const me = this;
      const dom = me.dom;
      const settings = me.settings;

      if (settings.add.call(this, null, elem) === false) {
         return false;
      }

      const items = Array.prototype.filter.call(dom.children, n => azdom.matches(n, '.azSortableItem:not(.az-placeholder)'));

      let nearestItem = null;
      let direction = true;
      let distance = Number.MAX_SAFE_INTEGER;
      items.map(item => {
         const bcr = item.getBoundingClientRect();
         const x = bcr.left + azdom.getDocScrollLeft() + bcr.width / 2;
         const y = bcr.top + azdom.getDocScrollTop() + bcr.height / 2;
         const dx = cursorX - x;
         const dy = cursorY - y;
         const d = dx * dx + dy * dy;
         if (d < distance) {
            distance = d;
            nearestItem = item;

            if (settings.align === 'x') {
               direction = dx >= 0;
            } else if (settings.align === 'y') {
               direction = dy >= 0;
            }
         }
      });

      if (!nearestItem) {
         dom.appendChild(elem);
      } else {
         if (direction) {
            azdom.insertAfter(elem, nearestItem);
         } else {
            azdom.insertBefore(elem, nearestItem);
         }
      }

      elem.classList.add('azSortableItem');

      const draggable = makeDraggable(elem, me.dragConfig);
      const droppable = makeDroppable(elem, me.dropConfig);
      draggable.sortContainer = me;
      droppable.sortContainer = me;
   }

   dragConfig = {
      containment: this.dom,
      resist: 5,
      create: this.onDragCreate,
      start: this.onDragStart,
      stop: this.onDragStop,
   };

   dropConfig = {
      interestedDropEvents: azdom.dndEvent.target_center_in | azdom.dndEvent.target_center_out,
      target_center_in: this.onOverTargetCenter,
      target_center_out: this.onLeaveTargetCenter,
   };

   onDragCreate(e) {
      if (this.sortContainer.settings.create.call(this.sortContainer, e) === false) {
         return false;
      }
   };

   onDragStart(e) {
      const sortContainerSettings = this.sortContainer.settings;
      this.sortContainer.selected = this.dom;
      if (sortContainerSettings.start.call(this.sortContainer, e) === false) {
         return false;
      }
      this.dom.style['z-index'] = ++this.sortContainer.z;
      this.dom.classList.add('azSortableSelected');

      if (sortContainerSettings.placeholder) {
         this.sortContainer.ph = this.dom.cloneNode(false);
         this.sortContainer.ph.removeAttribute('id');
         this.sortContainer.ph.classList.add('az-placeholder');
         if (!sortContainerSettings.showPlaceHolder) {
            this.sortContainer.ph.style['visibility'] = 'hidden';
         }
         // console.log(target, this.ph);

         const w = azdom.getWidth(this.dom);
         const h = azdom.getHeight(this.dom);
         const offsetTop = azdom.position(this.dom).top + this.dom.scrollTop;
         const offsetLeft = azdom.position(this.dom).left + this.dom.scrollLeft;
         // console.log(offsetTop, offsetLeft);
         this.sortContainer.ph.style['background-color'] = 'red';

         this.dom.style.position = 'absolute';
         this.dom.style.top = offsetTop + 'px';
         this.dom.style.left = offsetLeft + 'px';
         this.dom.style.right = 'auto';
         this.dom.style.bottom = 'auto';
         azdom.setWidth(this.dom, w);
         azdom.setHeight(this.dom, h);
         // insert me.ph before me.selected
         azdom.insertBefore(this.sortContainer.ph, this.dom);
      } else {
         this.dom.classList.add('azSortableDeny');
      }
   }

   onOverTargetCenter(e) {
      console.log('on over target center!');
      const settings = this.sortContainer.settings;
      const data = e.detail;
      if (!data.source.classList.contains('azSortableItem') || data.source.classList.contains('az-sortable-moving')) {
         return;
      }
      if (settings.sort?.call(this.sortContainer, e, data) === false) {
         return false;
      }
      if (settings.placeholder) {
         if (this.sortContainer.ph) {
            // console.log('ph:', this.sortContainer.dom);
            // console.log('target:', data.target);
            azdom.swapElement(this.sortContainer.ph, data.target);
         }
         // console.log(data.target);
      } else if (this.sortContainer.selected) {
         azdom.siblings(data.target).forEach(el => el.classList.remove('azSortableDropAfter', 'azSortableDropBefore'));
         data.target.classList.add(azdom.index(this.sortContainer.selected) < azdom.index(data.target) ? 'azSortableDropAfter' : 'azSortableDropBefore');
         this.sortContainer.selected.classList.remove('azSortableDeny');
         this.sortContainer.selected.classList.add('azSortableAllow');
         this.sortContainer.ph = data.target;
      }
   }

   onLeaveTargetCenter(e) {
      // console.log('on leave target center!');
      const settings = this.sortContainer.settings;
      const data = e.detail;
      if (!data.source.classList.contains('azSortableItem')) {
         return;
      }
      if (settings.sorted?.call(this.sortContainer, e, data) === false) {
         return false;
      }
      if (!settings.placeholder && this.sortContainer.selected) {
         azdom.siblings(this.sortContainer.selected).forEach(el => el.classList.remove('azSortableDropAfter', 'azSortableDropBefore'));
         this.sortContainer.selected.classList.remove('azSortableAllow');
         this.sortContainer.selected.classList.add('azSortableDeny');
         this.sortContainer.ph = null;
      }
   }

   onDragStop(e) {
      // console.log('on drag stop');
      const sortContainerSettings = this.sortContainer.settings;
      const data = {
         source: this.sortContainer.selected,
         target: this.sortContainer.ph,
         boundingClientRect: this.dom.getBoundingClientRect(),
         detached: this.detachedX || this.detachedY
      };
      if (this.sortContainer.selected) {
         this.sortContainer.selected.classList.remove('azSortableSelected');
         this.sortContainer.selected.classList.remove('azSortableAllow');
         this.sortContainer.selected.classList.remove('azSortableDeny');
         if (this.sortContainer.ph) {
            if (sortContainerSettings.placeholder) {
               this.sortContainer.selected.style.width = '';
               this.sortContainer.selected.style.height = '';
               azdom.insertBefore(this.sortContainer.selected, this.sortContainer.ph);
               this.sortContainer.ph.remove();
               this.dom.style.position = 'relative';
            } else {
               this.sortContainer.ph.classList.remove('azSortableDropBefore');
               this.sortContainer.ph.classList.remove('azSortableDropAfter');
               if (azdom.index(this.sortContainer.selected) < azdom.index(this.sortContainer.ph)) {
                  azdom.insertAfter(this.sortContainer.selected, this.sortContainer.ph);
               } else {
                  azdom.insertBefore(this.sortContainer.selected, this.sortContainer.ph);
               }
            }
            this.sortContainer.ph = null;
         }
         this.sortContainer.selected = null;
      }
      // console.log(me.selected, target, me.ph);
      this.dom.style.top = '';
      this.dom.style.left = '';
      this.dom.style.right = '';
      this.dom.style.bottom = '';

      this.detachedX = false;
      this.detachedY = false;

      if (this.originalContainer) {
         if (this.originalContainer.settings.stop.call(this.originalContainer, e, data) === false) {
            return false;
         }
      } else if (this.sortContainer.settings.stop.call(this.sortContainer, e, data) === false) {
         return false;
      }

      this.originalContainer = null;
      this.detachedContainer = null;
   }
}
