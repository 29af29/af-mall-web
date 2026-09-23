// 价格格式化：后端以「分」存储，这里转为「元」显示
export function formatPrice(cents) {
  if (cents == null || cents === '') return '¥0'
  const yuan = cents / 100
  return '¥' + (Number.isInteger(yuan) ? yuan : yuan.toFixed(2))
}

// 订单状态文案
export const ORDER_STATUS = {
  1: '待付款',
  2: '已付款',
  3: '已发货',
  4: '已完成',
  5: '已取消',
  6: '已关闭'
}

export function orderStatusText(status) {
  return ORDER_STATUS[status] || '未知状态'
}

// 时间格式化：2026-09-23T16:00:00 → 2026-09-23 16:00:00
export function formatDateTime(value) {
  if (!value) return ''
  return String(value).replace('T', ' ').slice(0, 19)
}
