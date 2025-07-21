import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 安全地处理数字输入框的值
 * 确保只有有效的数字才能被设置到 type="number" 的输入框中
 * @param value 原始值
 * @returns 安全的数字字符串或空字符串
 */
export function getSafeNumberValue(value: any): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  
  // 如果是数字，直接返回
  if (typeof value === 'number') {
    return value.toString();
  }
  
  // 如果是字符串，尝试提取数字
  if (typeof value === 'string') {
    // 移除所有非数字字符（除了小数点和负号）
    const numericValue = value.replace(/[^\d.-]/g, '');
    
    // 如果提取后是有效的数字，返回它
    if (numericValue && !isNaN(parseFloat(numericValue))) {
      return numericValue;
    }
  }
  
  // 如果无法解析为有效数字，返回空字符串
  return '';
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('日期格式化失败:', error);
    return dateString;
  }
}
