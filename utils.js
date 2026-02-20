// Utility functions

function getLineColor(line) {
    // Check if line or its properties are undefined
    if (!line) return '#7B7B7B';

    // Check for specific Overground lines
    if (line.name && line.name.toLowerCase().includes('lioness')) return LINE_COLORS['london-overground'];
    if (line.name && line.name.toLowerCase().includes('mildmay')) return LINE_COLORS['london-overground'];
    if (line.name && line.name.toLowerCase().includes('windrush')) return LINE_COLORS['london-overground'];
    if (line.name && line.name.toLowerCase().includes('weaver')) return LINE_COLORS['london-overground'];
    if (line.name && line.name.toLowerCase().includes('suffragette')) return LINE_COLORS['london-overground'];
    if (line.name && line.name.toLowerCase().includes('liberty')) return LINE_COLORS['london-overground'];

    // For standard lines, look up by ID
    if (line.id) {
        for (const [key, color] of Object.entries(LINE_COLORS)) {
            if (line.id.toLowerCase().includes(key)) {
                return color;
            }
        }
    }

    // Default color if no match found
    return '#7B7B7B';
}

function isOvergroundLine(line) {
    return line.id.toLowerCase().includes('overground') ||
        line.name.toLowerCase().includes('overground') ||
        line.name.toLowerCase().includes('lioness') ||
        line.name.toLowerCase().includes('mildmay') ||
        line.name.toLowerCase().includes('windrush') ||
        line.name.toLowerCase().includes('weaver') ||
        line.name.toLowerCase().includes('suffragette') ||
        line.name.toLowerCase().includes('liberty');
}
