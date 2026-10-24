import { type Item } from './schemas';
export function isTask(item:Pick<Item,'name'|'kind'>){if(item.kind)return item.kind==='task';return /^(?:manage|set|plan|check|review|verify|confirm|research|compare|pack|book|arrange|download|back up)\b/i.test(item.name.trim())||/^(?:設定|检查|檢查|確認|安排|規劃|收拾|打包|管理)/.test(item.name.trim());}
