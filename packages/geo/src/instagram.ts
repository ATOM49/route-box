export const INSTAGRAM_GRID = {
  columns: 3,
  rows: 2,
  tileSizePx: 1080,
  compositeWidthPx: 3240,
  compositeHeightPx: 2160,
  aspectRatio: 3 / 2,
} as const;

export interface InstagramCropBox {
  row: number;
  col: number;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Instagram upload order (1 = post first) */
  uploadOrder: number;
}

/**
 * Compute 6 crop boxes for the 3x2 Instagram grid.
 * Upload order: newest post first = right-to-left, top-to-bottom
 * Order: r1-c2, r1-c1, r1-c0, r0-c2, r0-c1, r0-c0
 */
export function computeInstagramCropBoxes(): InstagramCropBox[] {
  const { tileSizePx } = INSTAGRAM_GRID;
  const boxes: InstagramCropBox[] = [];

  const uploadOrder = [
    { row: 1, col: 2 },
    { row: 1, col: 1 },
    { row: 1, col: 0 },
    { row: 0, col: 2 },
    { row: 0, col: 1 },
    { row: 0, col: 0 },
  ];

  for (let order = 0; order < uploadOrder.length; order++) {
    const { row, col } = uploadOrder[order]!;
    boxes.push({
      row,
      col,
      x: col * tileSizePx,
      y: row * tileSizePx,
      width: tileSizePx,
      height: tileSizePx,
      uploadOrder: order + 1,
    });
  }

  return boxes;
}
