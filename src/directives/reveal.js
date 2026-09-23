/**
 * v-reveal —— 滚动渐入指令
 *
 * 用法：
 *   <div v-reveal>...</div>           元素进入视口时淡入上浮
 *   <div v-reveal="120">...</div>     额外延迟 120ms（用于错峰入场）
 *
 * 特性：
 *   - 基于 IntersectionObserver，元素进入视口后才触发，触发一次即断开
 *   - 自动尊重 prefers-reduced-motion，用户关闭动效时直接显示
 */
export default {
  mounted(el, binding) {
    const delay = Number(binding.value) || 0

    el.classList.add('reveal')
    if (delay > 0) {
      el.style.transitionDelay = `${delay}ms`
    }

    // 用户偏好减少动效：直接呈现，不做动画
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion || typeof IntersectionObserver === 'undefined') {
      el.classList.add('reveal-in')
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          el.classList.add('reveal-in')
          observer.disconnect()
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -48px 0px' }
    )

    observer.observe(el)
    el._revealObserver = observer
  },

  unmounted(el) {
    if (el._revealObserver) {
      el._revealObserver.disconnect()
      delete el._revealObserver
    }
  }
}
