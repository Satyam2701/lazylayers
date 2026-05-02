figma.showUI(__html__, { width: 360, height: 560, themeColors: true });

function sendSelection(): void {
  const sel = figma.currentPage.selection;
  figma.ui.postMessage({
    type: 'selection',
    count: sel.length,
    names: sel.map(n => n.name)
  });
}

sendSelection();
figma.on('selectionchange', sendSelection);

figma.ui.onmessage = (msg: { type: string; [key: string]: unknown }) => {
  const sel = figma.currentPage.selection;

  if (msg.type === 'find-replace') {
    if (sel.length === 0) { figma.notify('Select at least one layer first!'); return; }
    const flags = msg.caseSensitive ? 'g' : 'gi';
    const escaped = (msg.find as string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(escaped, flags);
    let count = 0;
    sel.forEach(node => {
      const next = node.name.replace(re, msg.replace as string);
      if (next !== node.name) { node.name = next; count++; }
    });
    figma.notify(count ? `Renamed ${count} layer${count > 1 ? 's' : ''}` : 'No matches found');
    sendSelection();
  }

  else if (msg.type === 'prefix-suffix') {
    if (sel.length === 0) { figma.notify('Select at least one layer first!'); return; }
    sel.forEach(node => {
      node.name = ((msg.prefix as string) || '') + node.name + ((msg.suffix as string) || '');
    });
    figma.notify(`Updated ${sel.length} layer${sel.length > 1 ? 's' : ''}`);
    sendSelection();
  }

  else if (msg.type === 'notify') {
    figma.notify(msg.message as string);
  }

  else if (msg.type === 'auto-number') {
    if (sel.length === 0) { figma.notify('Select at least one layer first!'); return; }
    const parsed = parseInt(msg.start as string, 10);
    const start = isNaN(parsed) ? 1 : parsed;
    sel.forEach((node, i) => {
      node.name = `${msg.base as string}${msg.sep as string}${start + i}`;
    });
    figma.notify(`Numbered ${sel.length} layer${sel.length > 1 ? 's' : ''}`);
    sendSelection();
  }

  else if (msg.type === 'open-url') {
    figma.openExternal(msg.url as string);
  }

  else if (msg.type === 'close') {
    figma.closePlugin();
  }
};
