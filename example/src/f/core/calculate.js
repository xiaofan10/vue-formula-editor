import functionCore from './functionCore'

/**
 * 计算公式
 * @param {{text: string, marks: Array, value: Object}} params
 * @returns
 */
function calculate(params) {
  const { text, marks = [], value = {} } = params

  if (!text) return new Error('非法公式')
  try {
    let str = text
    let offset = 0 // 偏移量
    marks.sort((a, b) => a.from.ch - b.from.ch)
    for (const mark of marks) {
      const { enCode, from, to, uuid } = mark

      let data = Number(value[enCode] || value[uuid])
      // 子表情况
      if (enCode.indexOf('.') > -1) {
        const [key, subKey] = enCode.split('.')
        if (value[key]) data = value[key].map(o => o[subKey])
      }
      if (data !== undefined) {
        data = JSON.stringify(data)
        // 替换字符串的指定部分
        const startIndex = from.ch + offset
        const endIndex = to.ch + offset

        str = str.slice(0, startIndex) + data.toString() + str.slice(endIndex)
        console.log(str)
        // 更新偏移量
        offset += data.toString().length - (to.ch - from.ch)
      } else {
        return undefined
      }
    }
    const result = functionCore.executeFunction(str)
    return result
  } catch (e) {
    const errorTypes = {
      TypeError: () => '类型错误',
      RangeError: () => '范围错误',
      SyntaxError: () => '语法错误',
      ReferenceError: () => {
        const regex = /^(\w+)\s+is\s+not\s+defined$/
        const match = e.message.match(regex)
        return match ? `${match[1]} 未定义` : '未定义的变量'
      },
    }
    const errorType = errorTypes[e.constructor.name]
    const errorMessage = errorType?.() || `其他错误: ${e.message}`
    return {
      error: true,
      message: errorMessage,
    }
  }
}

/**
 * 动态监听并返回计算结果
 * @param {VueContentInstance} vm 当前Vue实例
 * @param {Object} formData 计算公式所需的数据
 * @param {Object} formulaConf 计算公式配置
 * @param {Function} fn 回调函数
 * @returns {Function} 取消监听函数
 */
function formulaWatcher(vm, formData, formulaConf, fn) {
  const watchList = []
  const { key, value } = formData

  const toCalculate = () => {
    console.log(value, formulaConf.marks, formulaConf.text)
    const data = calculate({
      value,
      marks: formulaConf.marks,
      text: formulaConf.text,
    })
    fn(data)
  }
  formulaConf.marks.forEach(mark => {
    const [preCode] = mark.enCode.split('.')
    const watchItem = vm.$watch(`${key}.${preCode}`, toCalculate)
    watchList.push(watchItem)
  })
  // 初始化计算
  toCalculate()
  return () => watchList.forEach(watchItem => watchItem())
}
export { calculate, formulaWatcher }
