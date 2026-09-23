import request from './request'

/* ===== 认证 ===== */
export const authApi = {
  login: (data) => request.post('/auth/login', data),
  register: (data) => request.post('/auth/register', data)
}

/* ===== 用户 ===== */
export const userApi = {
  info: () => request.get('/user/info'),
  addressList: () => request.get('/user/address/list'),
  addAddress: (data) => request.post('/user/address', data),
  updateAddress: (id, data) => request.put(`/user/address/${id}`, data),
  deleteAddress: (id) => request.delete(`/user/address/${id}`)
}

/* ===== 商品 ===== */
export const productApi = {
  categoryTree: () => request.get('/product/category/tree'),
  spuPage: (params) => request.get('/product/spu/page', { params }),
  spuDetail: (id) => request.get(`/product/spu/${id}`),
  skuDetail: (id) => request.get(`/product/sku/${id}`),
  brandPage: (params) => request.get('/product/brand/page', { params })
}

/* ===== 搜索 ===== */
export const searchApi = {
  search: (params) => request.get('/search/spu', { params }),
  suggest: (prefix) => request.get('/search/suggest', { params: { prefix } })
}

/* ===== 购物车 ===== */
export const cartApi = {
  list: () => request.get('/cart/list'),
  add: (data) => request.post('/cart', data),
  updateNum: (skuId, num) => request.put(`/cart/${skuId}`, { num }),
  remove: (skuId) => request.delete(`/cart/${skuId}`),
  select: (skuId, selected) => request.put(`/cart/select/${skuId}`, { selected }),
  selectAll: (selected) => request.put('/cart/selectAll', { selected }),
  count: () => request.get('/cart/count')
}

/* ===== 订单 ===== */
export const orderApi = {
  create: (data) => request.post('/order', data),
  page: (params) => request.get('/order/page', { params }),
  detail: (id) => request.get(`/order/${id}`),
  cancel: (id) => request.put(`/order/${id}/cancel`),
  statusList: () => request.get('/order/status/list')
}

/* ===== 支付 ===== */
export const payApi = {
  pay: (data) => request.post('/pay', data),
  mock: (payNo) => request.post(`/pay/mock?payNo=${payNo}`),
  status: (orderId) => request.get(`/pay/${orderId}`)
}

/* ===== 通知 ===== */
export const notifyApi = {
  list: (params) => request.get('/notify/list', { params }),
  unread: () => request.get('/notify/unread'),
  markRead: (id) => request.put(`/notify/${id}/read`),
  markAllRead: () => request.put('/notify/read-all')
}
