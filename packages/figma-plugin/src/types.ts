import type { EventHandler } from '@create-figma-plugin/utilities';

export interface InsertIconHandler extends EventHandler {
  name: 'INSERT_ICON';
  handler: (iconName: string) => void;
}

export interface Bundle {
  icons: Record<string, string>;
  aliases: Record<string, string>;
}
