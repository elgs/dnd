import * as icons from './icons.js';
import { getDocScrollLeft, getDocScrollTop, isTouchDevice, matches, nextAll, normalizeIcon, parseDOMElement, siblings } from './lib.js';
import { makeContextMenu, makeSortable, makeDraggable, makeResizable, makeTabs } from './az.js';

let _tabId = 0;

const _getTabId = elemId => {
   return elemId
      .split('-')
      .splice(1, Number.MAX_SAFE_INTEGER)
      .join('-');
};

const getTabContextMenu = closable => [{
   // icon: icons.svgClose,
   title: 'Close tab',
   disabled: !closable,
   action: function (e, target) {
      const currentTabNode = target.closest('.azui-tabs');
      const currentTabs = makeTabs(currentTabNode);
      currentTabs.remove(_getTabId(target.getAttribute('tab-id')));
      return false;
   }
}, {
   // icon: icons.svgClose,
   title: 'Close other tabs',
   disabled: !closable,
   action: function (e, target) {
      const currentTabNode = target.closest('.azui-tabs');
      const currentTabs = makeTabs(currentTabNode);
      siblings(target, '.azTabLabel').forEach(function (element) {
         if (matches(element, '.azClosable')) {
            currentTabs.remove(_getTabId(element.getAttribute('tab-id')));
         }
      });
      return false;
   }
}, {
   // icon: icons.svgClose,
   title: 'Close tabs to the right',
   disabled: !closable,
   action: function (e, target) {
      const currentTabNode = target.closest('.azui-tabs');
      const currentTabs = makeTabs(currentTabNode);
      nextAll(target, '.azTabLabel').forEach(function (element) {
         if (matches(element, '.azClosable')) {
            currentTabs.remove(_getTabId(element.getAttribute('tab-id')));
         }
      });
      return false;
   }
},
   null,
{
   // icon: icons.svgClose,
   title: 'Close All',
   disabled: !closable,
   action: function (e, target) {
      const currentTabNode = target.closest('.azui-tabs');
      const currentTabs = makeTabs(currentTabNode);
      siblings(target, '.azTabLabel').forEach(function (element) {
         if (matches(element, '.azClosable')) {
            currentTabs.remove(_getTabId(element.getAttribute('tab-id')));
         }
      });
      currentTabs.remove(_getTabId(target.getAttribute('tab-id')));
      return false;
   }
}];

function closeClicked(event) {
   const currentTabNode = event.target.closest('.azui-tabs');
   const currentTabs = makeTabs(currentTabNode);
   const tabId = _getTabId(event.currentTarget.parentNode.getAttribute('tab-id'));
   currentTabs.remove(tabId);
   event.stopPropagation();
}

function createHeaderClicked(cm) {
   return function (event) {
      if (event.type === 'touchend') {
         // event.preventDefault();
         if (cm.rightClick.triggered) {
            return;
         }
      }

      const currentTabNode = event.target.closest('.azui-tabs');
      const currentTabs = makeTabs(currentTabNode);
      if (event.button === 2 || cm.on) {
         return;
      }
      // console.log(event.button);
      const tabId = _getTabId(event.currentTarget.getAttribute('tab-id'));
      if (!event.target.classList.contains('close') && !event.target.parentNode.classList.contains('close')) {
         currentTabs.activate(tabId, true);
      }
   };
}

function applyHeaderEvents(el) {
   if (el.headerEventsApplied) {
      return;
   }
   el.headerEventsApplied = true;
   const closable = matches(el, '.azClosable');
   const cm = makeContextMenu(el, {
      items: getTabContextMenu(closable)
   });
   const headerClicked = createHeaderClicked(cm);
   el.addEventListener('mouseup', headerClicked);
   el.addEventListener('touchend', headerClicked);
}

export class Tabs {
   static id = 'azui-tabs';
   static settings = {
      headerHeight: 36,
      draggable: true,
      resizable: true,
      detachable: true,
      closeOnEmpty: true
   };

   static z = 0;

   init() {

      const me = this;
      const dom = me.dom;
      const settings = me.settings;

      let tabHeaderContainer = dom.querySelector('div.azTabHeader');
      if (!tabHeaderContainer) {
         tabHeaderContainer = document.createElement('div');
         tabHeaderContainer.classList.add('azTabHeader');
         dom.appendChild(tabHeaderContainer);
      }
      const tabLabelList = dom.querySelectorAll('div.azTabLabel'); // a list
      const tabLabels = document.createElement('div');
      tabLabels.classList.add('azTabLabels');
      tabHeaderContainer.appendChild(tabLabels);

      tabLabelList.forEach(el => {
         applyHeaderEvents(el);
         el.style.height = settings.headerHeight + 'px';

         if (matches(el, '.azClosable')) {
            const iconDiv = document.createElement('div');
            iconDiv.classList.add('close');
            iconDiv.appendChild(parseDOMElement(icons.svgClose)[0]);
            iconDiv.addEventListener('click', closeClicked);
            el.appendChild(iconDiv);
         }
         tabLabels.appendChild(el);
      });
      me.activateByIndex(0);

      // me.dragging = false;
      me.sortable = makeSortable(tabLabels, {
         detachable: settings.detachable,
         create: function (e, target) {
            if (matches(e.target, '.close,.close *')) {
               return false; // don't drag when clicking on icons
            }
            if (e.type === 'touchstart') {
               // prevent tab window from moving around while being dragged.
               e.preventDefault();
            }
         },
         stop: function (e, data) {
            console.log(data);
            const draggable = data.source['azui-draggable'];
            const targetTabs = draggable.sortContainer.tabs;
            let sourceTabs = targetTabs;
            if (draggable.originalContainer) {
               sourceTabs = draggable.originalContainer?.tabs ?? targetTabs;
            }
            const tabId = _getTabId(data.source.getAttribute('tab-id'));
            if (data.detached) {
               const x = data.boundingClientRect.left + getDocScrollLeft();
               const y = data.boundingClientRect.top + getDocScrollTop();
               targetTabs.spawn(tabId, x, y);
            } else {
               const contentNode = sourceTabs.dom.querySelector('[tab-id=azTabContent-' + tabId + ']');
               // console.log(targetTabs.dom, sourceTabs);
               if (targetTabs.dom !== sourceTabs.dom) {
                  targetTabs.dom.appendChild(contentNode);

                  targetTabs.activate(tabId);

                  const tabHeader = data.source;
                  const headers = sourceTabs.dom.querySelectorAll('.azTabLabel');
                  if (headers.length) {
                     const active = tabHeader.parentNode.querySelector('.active');
                     if (!active) {
                        sourceTabs.activateByIndex(0);
                     }
                     sourceTabs.fitTabWidth();
                  } else if (settings.closeOnEmpty) {
                     sourceTabs.dom.remove();
                  }
               }
            }
         },
         enter: function (e, sortable) {
            sortable.tabs.dom.style['z-index'] = ++Tabs.z;
         },
      });
      me.sortable.tabs = me;

      tabHeaderContainer.style['height'] = settings.headerHeight + 'px';

      if (settings.draggable) {
         makeDraggable(dom, {
            handle: '.azTabHeader',
            snapDistance: 8,
            create: function (event, ui) {
               me.dom.style['z-index'] = ++Tabs.z;
               // console.log(event.target.classList.contains('azTabHeader'));
               // console.log(event.target.classList);
            }
         });
      }
      if (settings.resizable) {
         makeResizable(dom, {
            hideHandles: true,
            minHeight: settings.headerHeight * 2,
            minWidth: 240,
            resize: e => {
               me.fitTabWidth();
            }
         });
      }

      const mouseDownTouchStartEventListener = function (event) {
         me.dom.style['z-index'] = ++Tabs.z;
      };
      me.dom.addEventListener('mousedown', mouseDownTouchStartEventListener);

      if (isTouchDevice()) {
         me.dom.addEventListener('touchstart', mouseDownTouchStartEventListener);
      }
   }

   fitTabWidth() {
      const me = this;
      const dom = me.dom;
      const nodeWidth = parseInt(getComputedStyle(dom)['width']);
      const tabLabels = dom.querySelectorAll('.azTabLabel:not(.az-placeholder)');
      const newWidth = Math.min((nodeWidth - (me.settings.draggable ? 40 : 0)) / tabLabels.length, 150);
      tabLabels.forEach(tabLabel => {
         // console.log(tabLabel);
         if (newWidth < 60) {
            tabLabel.querySelector('.icon').style['display'] = 'none';
            tabLabel.style['grid-template-columns'] = '0 1fr 30px';
         } else {
            tabLabel.querySelector('.icon').style['display'] = '';
            tabLabel.style['grid-template-columns'] = '30px 1fr 30px';
         }
         tabLabel.style['width'] = newWidth + 'px';
      });
   }

   spawn(tabId, x = 10, y = 10) {
      const me = this;
      const dom = me.dom;
      const tabHeader = document.querySelector('.azTabLabel[tab-id=azTabHeader-' + tabId + ']');
      const tabContent = document.querySelector('[tab-id=azTabContent-' + tabId + ']');
      const isActive = matches(tabHeader, '.active');

      const parentBcr = dom.parentNode.getBoundingClientRect();
      const parentX = parentBcr.left + getDocScrollLeft();
      const parentY = parentBcr.top + getDocScrollTop();
      const parentStyle = getComputedStyle(dom.parentNode);
      const parentBorderTop = parseInt(parentStyle['border-top-width']);
      const parentBorderLeft = parseInt(parentStyle['border-left-width']);
      if (parentStyle.position !== 'relative' && parentStyle.position !== 'absolute' && parentStyle.position !== 'fixed') {
         dom.parentNode.style.position = 'relative';
      }

      const nodeStyle = getComputedStyle(dom);
      // console.log(nodeStyle.width, nodeStyle.height);
      const newTabsElem = document.createElement('div');
      newTabsElem.style.width = nodeStyle.width;
      newTabsElem.style.height = nodeStyle.height;
      newTabsElem.style.position = nodeStyle.position;
      newTabsElem.style.top = y - parentY - parentBorderTop + 'px';
      newTabsElem.style.left = x - parentX - parentBorderLeft + 'px';
      dom.parentNode.appendChild(newTabsElem);
      const newTabs = makeTabs(newTabsElem, {});
      newTabs.dom.style['z-index'] = ++Tabs.z;

      // const newLabels = newNode.querySelector('div.azTabHeader>.azTabLabels');
      // console.log(tabHeader, newLabels);
      // newLabels.appendChild(tabHeader);
      tabContent.style['display'] = 'block';
      newTabs.add(null, tabHeader, tabContent);
      // remove(tabHeader);

      const headers = dom.querySelectorAll('.azTabLabel');
      if (headers.length) {
         if (isActive) {
            me.activateByIndex(0);
         }
         // me.showHideScrollers();
         me.fitTabWidth();
      } else if (me.settings.closeOnEmpty) {
         dom.remove();
      }
   }

   add(icon, title, content, closable = true, activate = true, tabId = null, trigger = false) {
      const me = this;

      if (tabId) {
         const labels = [...me.dom.querySelectorAll('div.azTabLabel')];
         for (const el of labels) {
            const elId = _getTabId(el.getAttribute('tab-id'));
            if (elId === tabId) {
               me.activate(tabId);
               return true;
            }
         }
      }

      tabId ??= ++_tabId;

      const iconDiv = document.createElement('div');
      iconDiv.classList.add('icon');
      iconDiv.appendChild(normalizeIcon(icon ?? ''));

      let headerNode;
      if (typeof title === 'string') {
         const titleDiv = document.createElement('div');
         titleDiv.classList.add('title');
         titleDiv.appendChild(normalizeIcon(title));
         headerNode = document.createElement('div');
         // headerNode.classList.add('azTabLabel');
         headerNode.appendChild(iconDiv);
         headerNode.appendChild(titleDiv);

         if (closable) {
            const closeDiv = document.createElement('div');
            closeDiv.classList.add('close');
            closeDiv.appendChild(parseDOMElement(icons.svgClose)[0]);
            headerNode.appendChild(closeDiv);
            headerNode.classList.add('azClosable');
         }
      } else {
         headerNode = title;
      }

      headerNode.classList.add('azTabLabel');
      headerNode.style.height = me.settings.headerHeight + 'px';
      headerNode.setAttribute('tab-id', 'azTabHeader-' + tabId);

      const closeDiv = headerNode.querySelector('.close');
      if (closeDiv) {
         closeDiv.addEventListener('click', closeClicked);
      }

      me.sortable.add(headerNode);

      let contentNode;
      if (content && typeof content === 'string') {
         contentNode = document.createElement('div');
         contentNode.innerHTML = content;
      } else {
         contentNode = content;
      }
      contentNode.setAttribute('tab-id', 'azTabContent-' + tabId);
      contentNode.classList.add('azTabContent');
      contentNode.style['display'] = 'none';
      me.dom.appendChild(contentNode);

      applyHeaderEvents(headerNode);

      // me.showHideScrollers();
      me.fitTabWidth();
      if (activate) {
         me.activate(tabId, trigger);
      }
      return tabId;
   }

   remove(tabId) {
      const me = this;
      const dom = me.dom;
      const tab = dom.querySelector('.azTabLabel[tab-id=azTabHeader-' + tabId + ']');
      const isActive = matches(tab, '.active');
      tab.remove();
      dom.querySelector('[tab-id=azTabContent-' + tabId + ']').remove();
      const headers = dom.querySelectorAll('.azTabLabel');
      if (headers.length) {
         if (isActive) {
            me.activateByIndex(0);
         }
         me.fitTabWidth();
      } else if (me.settings.closeOnEmpty) {
         dom.remove();
      }
   }
   activate(tabId, trigger = false) {
      tabId = String(tabId);
      const me = this;
      const dom = me.dom;
      let activated = false;

      if (trigger) {
         dom.dispatchEvent(
            new CustomEvent('willActivate', {
               detail: {
                  tabId
               }
            })
         );
      }

      dom.querySelectorAll('div.azTabContent').forEach(el => {
         const elId = _getTabId(el.getAttribute('tab-id'));
         if (elId === tabId) {
            el.style['display'] = 'block';
         } else {
            el.style['display'] = 'none';
         }
      });
      dom.querySelectorAll('div.azTabLabel').forEach(el => {
         const elId = _getTabId(el.getAttribute('tab-id'));
         if (elId === tabId) {
            el.classList.add('active');
            activated = true;
         } else {
            el.classList.remove('active');
         }
      });

      if (trigger && activated) {
         dom.dispatchEvent(
            new CustomEvent('didActivate', {
               detail: {
                  tabId
               }
            })
         );
      }

      return activated;
   }
   activateByIndex(tabIndex, trigger = false) {
      const me = this;
      const dom = me.dom;
      let activated = false;

      let tabId;
      dom.querySelectorAll('div.azTabContent').forEach((el, index) => {
         if (index === tabIndex) {
            if (trigger) {
               tabId = _getTabId(el.getAttribute('tab-id'));
               dom.dispatchEvent(
                  new CustomEvent('willActivate', {
                     detail: {
                        tabId
                     }
                  })
               );
            }
            el.style['display'] = 'block';
         } else {
            el.style['display'] = 'none';
         }
      });
      dom.querySelectorAll('div.azTabLabel').forEach((el, index) => {
         if (index === tabIndex) {
            el.classList.add('active');
            activated = true;
         } else {
            el.classList.remove('active');
         }
      });
      if (trigger && activated) {
         dom.dispatchEvent(
            new CustomEvent('didActivate', {
               detail: {
                  tabId
               }
            })
         );
      }
      return activated;
   }
}
