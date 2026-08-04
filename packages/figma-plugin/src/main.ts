import { on, showUI } from '@create-figma-plugin/utilities';

import rawBundle from './generated/icons.json';
import type { Bundle, InsertIconHandler } from './types';

const bundle = rawBundle as Bundle;

export default function () {
  on<InsertIconHandler>('INSERT_ICON', async (iconName) => {
    const svg = bundle.icons[iconName];
    if (svg === undefined) return;

    await figma.currentPage.loadAsync();
    const imported = figma.createNodeFromSvg(svg);
    const node = figma.flatten([imported], figma.currentPage);
    node.name = iconName;
    node.x = figma.viewport.center.x - node.width / 2;
    node.y = figma.viewport.center.y - node.height / 2;
    figma.currentPage.selection = [node];
    figma.viewport.scrollAndZoomIntoView([node]);
  });

  showUI({ width: 320, height: 480 });
}
