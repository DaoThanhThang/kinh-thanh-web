// Chỉ chạy phía server (đọc fs). Gói `server-only` chưa có trong dependencies nên không import.
import { existsSync } from 'node:fs';
import path from 'node:path';
import boxesRaw from '../../../data/boxes.json';
import chocolatesRaw from '../../../data/chocolates.json';
import { normalizeBoxes, normalizeChocolates, type CatalogService } from './catalog-core';

export type { CatalogService } from './catalog-core';

const warn = (message: string) => console.warn(message);

function publicFileExists(publicPath: string): boolean {
  return existsSync(path.join(process.cwd(), 'public', publicPath));
}

/** Nguồn JSON tĩnh. Thêm viên = thêm một dòng JSON + một file ảnh, không sửa code. */
export const jsonCatalog: CatalogService = {
  async getChocolates() {
    return normalizeChocolates(chocolatesRaw, { exists: publicFileExists, warn });
  },
  async getChocolateById(id) {
    return (await this.getChocolates()).find((c) => c.id === id);
  },
  async getBoxOptions() {
    return normalizeBoxes(boxesRaw, warn);
  },
};

export const getChocolates = () => jsonCatalog.getChocolates();
export const getChocolateById = (id: string) => jsonCatalog.getChocolateById(id);
export const getBoxOptions = () => jsonCatalog.getBoxOptions();
