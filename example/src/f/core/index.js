import { generateRandomData } from '../utils'
import { calculate } from './calculate'

export default class FormulaEditorCore {
  editor = null // 编辑器实例
  formulaObjList = [] // 公式对象列表
  text = '' // 公式文本
  marks = [] // 需替换的变量列表
  listen = ['change', 'inputRead', 'beforeChange'] // 监听方法

  constructor(editor, text = '', formulaObjList = []) {
    this.editor = editor
    this.text = text
    this.formulaObjList = formulaObjList
  }

  // 获取公式列表
  getFormulaList() {
    return this.formulaObjList.flatMap(o => o.formula)
  }

  // 数据回显
  renderData(formulaData) {
    if (Object.keys(formulaData).length === 0) return

    this.editor.setValue(formulaData.text)
    this.marks = formulaData.marks
    this.marks.forEach(o => {
      this.editor.doc.markText(o.from, o.to, {
        className: 'cm-field',
        attributes: {
          'data-menuId': o.menuId,
          'data-enCode': o.enCode,
          'data-enType': o.enType,
          'data-enText': o.enText,
          'data-enFormula': o.enFormula,
        },
        atomic: true,
      })
    })
  }

  // 校验公式
  validateFormula(fieldList) {
    const variable = fieldList.reduce((acc, cur) => {
      acc[cur.enCode] = generateRandomData(cur.value)
      return acc
    }, {})
    const result = calculate({ ...this.getData(), value: variable })
    if (!result) {
      return { error: false }
    }
    const calculateResult = result.toString().includes('Error: #VALUE!')
    if (calculateResult) {
      return { error: true, message: '公式计算错误，请检查公式' }
    }
    if (result.error) {
      return result
    }
    return { error: false }
  }

  // 注册监听器
  registerListen() {
    for (const item of this.listen) {
      const fn = this[`on${item.charAt(0).toUpperCase()}${item.slice(1)}`]
      this.editor.on(item, fn.bind(this, ...arguments))
    }
  }

  onInputRead(cm, change) {
    cm.showHint({
      hint: this.customHint.bind(this),
      completeSingle: false,
    })
  }

  getData() {
    console.log('编辑器公式', {
      text: this.text,
      marks: this.marks,
    })

    // console.log(
    //   JSON.stringify(
    //     JSON.stringify({
    //       text: this.text,
    //       marks: this.marks,
    //     })
    //   )
    // )
    return {
      text: this.text,
      marks: this.marks,
    }
  }

  reset() {
    this.editor.setValue('')
    this.text = ''
    this.marks = []
  }

  // 当编辑器中文本内容改变
  onChange(cm, changeObj) {
    this.marks = cm
      .getAllMarks()
      .filter(o => o.className === 'cm-field')
      .map(marks => {
        const { attributes } = marks
        return {
          ...marks.find(),
          enType: attributes['data-enType'],
          enFormula: attributes['data-enFormula'],
          enText: attributes['data-enText'],
          enCode: attributes['data-enCode'],
          menuId: attributes['data-menuId'],
        }
      })
    // console.log('change', cm.getAllMarks(), cm.getValue(), this.marks)
    this.text = cm.getValue()
    if (changeObj.origin === 'complete') {
      // 向左移动一个字符
      this.moveCursor('left', 1)
    }
  }

  /**
   * 插入文本
   * @param {string | object} text
   * @param {'formula' | 'field'} type
   */
  insertText(data, type) {
    const cursor = this.editor.getCursor()

    this.editor.replaceRange(
      type === 'field' ? JSON.stringify(data) : data,
      cursor
    )
    type === 'formula' && this.moveCursor('left', 1)
    this.editor.focus()
  }

  /**
   *
   * @param {'left' | 'right' | 'up' | 'down'} direction 方向
   * @param {number} step 步长
   */
  moveCursor(direction, step) {
    const cursor = this.editor.getCursor()
    const line = cursor.line
    const ch = cursor.ch

    // 检查是否已经在行首
    if (direction === 'left') {
      // 如果不是行首，则向左移动字符
      this.editor.setCursor({ line: line, ch: ch - step })
    } else if (direction === 'right') {
      // 如果是行首，则向右移动字符
      this.editor.setCursor({ line: line, ch: ch + step })
    } else if (direction === 'up') {
      // 如果是行首，则向上移动行
      this.editor.setCursor({ line: line - step, ch: ch })
    } else if (direction === 'down') {
      // 如果是行首，则向下移动行
      this.editor.setCursor({ line: line + step, ch: ch })
    }
  }

  isValidJSON(str) {
    if (typeof str !== 'string') {
      return false // 只处理字符串
    }

    try {
      const p = JSON.parse(str)
      return typeof p === 'object' // 解析成功，字符串是有效的 JSON
    } catch (e) {
      return false // 解析失败，字符串不是有效的 JSON
    }
  }

  onBeforeChange(cm, changeObj) {
    const { text, from, cancel, origin } = changeObj
    const isJson = this.isValidJSON(text[0])
    console.log(changeObj)
    if (origin === 'paste') {
      cancel()
    }
    if (!text.join('').replace(/[\s]+/g, '') && origin === '+input') {
      cancel()
    }
    if (text) {
      // const data = this.matchField(text[0])

      if (isJson) {
        cancel()
        const field = JSON.parse(text[0])
        const fieldFrom = { ...from }
        const to = { ...from, ch: from.ch + field.fullName.length }
        cm.replaceRange(field.fullName, fieldFrom)
        cm.doc.markText(fieldFrom, to, {
          className: 'cm-field',
          attributes: {
            'data-menuId': field.menuId,
            'data-enCode': field.enCode,
            'data-enText': field.fullName,
            'data-enFormula': field.formula,
            'data-enType': field.type,
          },
          atomic: true,
        })
      }
    }
  }

  // 匹配字段
  matchField(text) {
    const regex = /\{[^}]+\}/g
    return text.match(regex) || []
  }

  // 匹配当前行的公式
  matchWord(text) {
    // 使用正则表达式提取出字母部分
    const match = text.match(/[a-zA-Z]+$/)
    return match ? match[0] : ''
  }

  // 匹配当前行的公式
  matchFormula(text) {
    if (!text) return false

    const suggestions = this.getFormulaList()
    const match = suggestions.find(o => o.name === text)
    return match
  }

  // 自定义提示函数
  customHint(cm) {
    // 游标
    const cursor = cm.getCursor()
    // 当前行文本
    const currentLineText = cm.getLine(cursor.line)
    const matchWords = this.matchWord(currentLineText)
    const start = cursor.ch
    const suggestions = this.getFormulaList()
    const result = {
      list: suggestions
        .map(o => ({ text: `${o.name}()`, displayText: o.name, tip: o.tip }))
        .filter(
          suggestion =>
            matchWords &&
            suggestion.text.toLowerCase().includes(matchWords.toLowerCase())
        )
        .map(suggestion => {
          const text = suggestion.displayText
          const matchIndex = text
            .toLowerCase()
            .indexOf(matchWords.toLowerCase())
          suggestion.render = function (element, self, data) {
            if (matchIndex >= 0) {
              const beforeMatch = text.slice(0, matchIndex)
              const match = text.slice(
                matchIndex,
                matchIndex + matchWords.length
              )
              const afterMatch = text.slice(matchIndex + matchWords.length)

              const span = document.createElement('span')

              if (beforeMatch) {
                span.appendChild(document.createTextNode(beforeMatch))
              }

              const highlight = document.createElement('span')
              highlight.textContent = match
              highlight.style.fontWeight = 'bold'
              highlight.style.color = '#ff0000'
              span.appendChild(highlight)

              if (afterMatch) {
                span.appendChild(document.createTextNode(afterMatch))
              }

              element.appendChild(span)
            } else {
              element.appendChild(document.createTextNode(text))
            }
          }

          return suggestion
        }),
      from: { line: cursor.line, ch: start - matchWords.length },
      to: { line: cursor.line, ch: start },
    }
    return result
  }
}
