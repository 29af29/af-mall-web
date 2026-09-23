/**
 * 加购飞入购物车动画
 *
 * 以商品图为起点，沿抛物线飞向导航栏的购物车图标（[data-cart-anchor]），
 * 落点后派发 cart:added 事件，由 NavBar 负责刷新角标并做弹跳反馈。
 *
 * @param {HTMLElement} sourceEl 起始元素，通常是商品卡片或详情页的大图容器
 * @param {string} imageUrl 飞行小球上显示的图片，可为空（用纯色球代替）
 */
export function flyToCart(sourceEl, imageUrl) {
  if (!sourceEl) return

  // 用户关闭动效时不播放
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const target = document.querySelector('[data-cart-anchor]')
  if (!target) return

  const from = sourceEl.getBoundingClientRect()
  const to = target.getBoundingClientRect()
  const size = 44

  const ball = document.createElement('div')
  ball.className = 'fly-ball'
  ball.style.width = `${size}px`
  ball.style.height = `${size}px`
  if (imageUrl) {
    ball.style.backgroundImage = `url("${imageUrl}")`
  }
  document.body.appendChild(ball)

  const startX = from.left + from.width / 2 - size / 2
  const startY = from.top + from.height / 2 - size / 2
  const endX = to.left + to.width / 2 - size / 2
  const endY = to.top + to.height / 2 - size / 2

  // 抛物线的最高点：横向取中点，纵向抬高
  const peakX = (startX + endX) / 2
  const peakY = Math.min(startY, endY) - 90

  const animation = ball.animate(
    [
      {
        transform: `translate3d(${startX}px, ${startY}px, 0) scale(1)`,
        opacity: 1,
        offset: 0
      },
      {
        transform: `translate3d(${peakX}px, ${peakY}px, 0) scale(0.86)`,
        opacity: 1,
        offset: 0.55
      },
      {
        transform: `translate3d(${endX}px, ${endY}px, 0) scale(0.2)`,
        opacity: 0.15,
        offset: 1
      }
    ],
    {
      duration: 760,
      easing: 'cubic-bezier(0.35, 0.1, 0.6, 1)',
      fill: 'forwards'
    }
  )

  const cleanup = () => {
    ball.remove()
    window.dispatchEvent(new CustomEvent('cart:added'))
  }

  animation.onfinish = cleanup
  // 兜底：动画被中断时也要清理，避免 DOM 残留
  animation.oncancel = () => ball.remove()
}
