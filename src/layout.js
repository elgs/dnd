import * as azdom from './lib.js';
import { makeResizable } from './az.js';

export class Layout {
   static id = 'azui-layout';
   static settings = {
      north: 'azLayoutNorth',
      east: 'azLayoutEast',
      south: 'azLayoutSouth',
      west: 'azLayoutWest',
      center: 'azLayoutCenter',
      northHeight: '50px',
      southHeight: '50px',
      westWidth: '100px',
      eastWidth: '100px',
      hideCollapseButtons: true
   };

   init() {
      const dom = this.dom;
      const me = this;
      const settings = this.settings;

      const handleSize = azdom.isTouchDevice() ? 8 : 4;

      const northContent = azdom.resolveDOM(dom, '*>.' + settings.north);
      const eastContent = azdom.resolveDOM(dom, '*>.' + settings.east);
      const southContent = azdom.resolveDOM(dom, '*>.' + settings.south);
      const westContent = azdom.resolveDOM(dom, '*>.' + settings.west);
      const centerContent = azdom.resolveDOM(dom, '*>.' + settings.center);

      let centerWidth, centerHeight;
      if (northContent) {
         const north = document.createElement('div');
         north.classList.add('azLayoutArea', 'azLayoutAreaNorth');
         north.style.height = settings.northHeight;
         me.dom.appendChild(north);
         me.north = north;
         makeResizable(me.north, {
            handles: 's',
            handleSize,
            hideCollapseButtons: settings.hideCollapseButtons,
            create: function (e, h) {
               centerHeight = azdom.getHeight(me.center);
               dom.querySelectorAll('iframe').forEach(iframe => {
                  iframe && (iframe.style['pointer-events'] = 'none');
               });
            },
            resize: function (e, h, by) {
               by.dy = Math.min(by.dy, centerHeight);
            },
            stop: function (e, el) {
               dom.querySelectorAll('iframe').forEach(iframe => {
                  iframe && (iframe.style['pointer-events'] = '');
               });
            },
            collapse: function (e, el) {
               dom.querySelectorAll('iframe').forEach(iframe => {
                  iframe && (iframe.style['pointer-events'] = '');
               });
            }
         });
         north.appendChild(northContent);
         me.northContent = northContent;
      }
      if (eastContent) {
         const east = document.createElement('div');
         east.classList.add('azLayoutArea', 'azLayoutAreaEast');
         east.style.width = settings.eastWidth;
         me.dom.appendChild(east);
         me.east = east;
         makeResizable(me.east, {
            handles: 'w',
            handleSize,
            hideCollapseButtons: settings.hideCollapseButtons,
            moveOnResize: false,
            create: function (e, h) {
               centerWidth = azdom.getWidth(me.center);
               dom.querySelectorAll('iframe').forEach(iframe => {
                  iframe && (iframe.style['pointer-events'] = 'none');
               });
            },
            resize: function (e, h, by) {
               // by.dx = Math.max(by.dx, -centerWidth);
            },
            stop: function (e, el) {
               dom.querySelectorAll('iframe').forEach(iframe => {
                  iframe && (iframe.style['pointer-events'] = '');
               });
            },
            collapse: function (e, el) {
               dom.querySelectorAll('iframe').forEach(iframe => {
                  iframe && (iframe.style['pointer-events'] = '');
               });
            }
         });
         east.appendChild(eastContent);
         me.eastContent = eastContent;
      }
      if (southContent) {
         const south = document.createElement('div');
         south.classList.add('azLayoutArea', 'azLayoutAreaSouth');
         south.style.height = settings.southHeight;
         me.dom.appendChild(south);
         me.south = south;
         makeResizable(me.south, {
            handles: 'n',
            handleSize,
            hideCollapseButtons: settings.hideCollapseButtons,
            moveOnResize: false,
            create: function (e, h) {
               centerHeight = azdom.getHeight(me.center);
               dom.querySelectorAll('iframe').forEach(iframe => {
                  iframe && (iframe.style['pointer-events'] = 'none');
               });
            },
            resize: function (e, h, by) {
               // by.dy = Math.max(by.dy, -centerHeight);
            },
            stop: function (e, el) {
               dom.querySelectorAll('iframe').forEach(iframe => {
                  iframe && (iframe.style['pointer-events'] = '');
               });
            },
            collapse: function (e, el) {
               dom.querySelectorAll('iframe').forEach(iframe => {
                  iframe && (iframe.style['pointer-events'] = '');
               });
            }
         });
         south.appendChild(southContent);
         me.southContent = southContent;
      }
      if (westContent) {
         const west = document.createElement('div');
         west.classList.add('azLayoutArea', 'azLayoutAreaWest');
         west.style.width = settings.westWidth;
         me.dom.appendChild(west);
         me.west = west;
         makeResizable(me.west, {
            handles: 'e',
            handleSize,
            hideCollapseButtons: settings.hideCollapseButtons,
            create: function (e, h) {
               centerWidth = azdom.getWidth(me.center);
               dom.querySelectorAll('iframe').forEach(iframe => {
                  iframe && (iframe.style['pointer-events'] = 'none');
               });
            },
            resize: function (e, h, by) {
               by.dx = Math.min(by.dx, centerWidth);
            },
            stop: function (e, el) {
               dom.querySelectorAll('iframe').forEach(iframe => {
                  iframe && (iframe.style['pointer-events'] = '');
               });
            },
            collapse: function (e, el) {
               dom.querySelectorAll('iframe').forEach(iframe => {
                  iframe && (iframe.style['pointer-events'] = '');
               });
            }
         });
         west.appendChild(westContent);
         me.westContent = westContent;
      }
      if (centerContent) {
         const center = document.createElement('div');
         center.classList.add('azLayoutArea', 'azLayoutAreaCenter');
         me.dom.appendChild(center);
         me.center = center;
         center.appendChild(centerContent);
         me.centerContent = centerContent;
      }

      // console.log(me.north, me.east, me.south, me.west, me.center);
   }
}
