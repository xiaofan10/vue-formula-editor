<template>
  <div id="app">
    <el-button type="text" @click="handleShow">配置公式</el-button>
    <el-form ref="form" :model="formData">
      <el-form-item v-for="item in fieldList" :label="item.fullName">
        <el-input
          v-model="formData[item.enCode]"
          @input="handleChange"></el-input>
      </el-form-item>
    </el-form>
    <div>计算结果：{{ result }}</div>
    <el-dialog title="配置公式" :visible.sync="dialogVisible" width="800px">
      <FormulaEditor
        :formulaList="list"
        ref="formulaEditor"
        :formulaConf="formulaConf"
        :loading="true"
        :fieldList="fieldList"></FormulaEditor>
      <span slot="footer" class="dialog-footer">
        <el-button @click="onCancel">取 消</el-button>
        <el-button type="primary" @click="onConfirm">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>
<script>
  import formulaObj from './formula'
  import { calculate, formulaWatcher, FormulaEditor } from './f/index'
  const fieldList = [
    {
      fullName: '总利润',
      value: 'string',
      enCode: 'tprofit',
      type: 'formula',
      formula:
        '{"text":"玉米利润+大豆利润","marks":[{"from":{"line":0,"ch":0,"sticky":null},"to":{"line":0,"ch":4,"sticky":null},"enType":"formula","enFormula":"{\\"text\\":\\"玉米总量*(玉米售价-玉米进价)\\",\\"marks\\":[{\\"from\\":{\\"line\\":0,\\"ch\\":0,\\"sticky\\":null},\\"to\\":{\\"line\\":0,\\"ch\\":4,\\"sticky\\":null},\\"enType\\":\\"atom\\",\\"enText\\":\\"玉米总量\\",\\"enCode\\":\\"ytotal\\"},{\\"from\\":{\\"line\\":0,\\"ch\\":6,\\"sticky\\":null},\\"to\\":{\\"line\\":0,\\"ch\\":10,\\"sticky\\":null},\\"enType\\":\\"atom\\",\\"enText\\":\\"玉米售价\\",\\"enCode\\":\\"youtprice\\"},{\\"from\\":{\\"line\\":0,\\"ch\\":11,\\"sticky\\":null},\\"to\\":{\\"line\\":0,\\"ch\\":15,\\"sticky\\":null},\\"enType\\":\\"atom\\",\\"enText\\":\\"玉米进价\\",\\"enCode\\":\\"yinprice\\"}]}","enText":"玉米利润","enCode":"yprofit"},{"from":{"line":0,"ch":5,"sticky":null},"to":{"line":0,"ch":9,"sticky":null},"enType":"formula","enFormula":"{\\"text\\":\\"大豆总量*(大豆售价-大豆进价)\\",\\"marks\\":[{\\"from\\":{\\"line\\":0,\\"ch\\":0,\\"sticky\\":null},\\"to\\":{\\"line\\":0,\\"ch\\":4,\\"sticky\\":null},\\"enType\\":\\"atom\\",\\"enText\\":\\"大豆总量\\",\\"enCode\\":\\"total\\"},{\\"from\\":{\\"line\\":0,\\"ch\\":6,\\"sticky\\":null},\\"to\\":{\\"line\\":0,\\"ch\\":10,\\"sticky\\":null},\\"enType\\":\\"atom\\",\\"enText\\":\\"大豆售价\\",\\"enCode\\":\\"outprice\\"},{\\"from\\":{\\"line\\":0,\\"ch\\":11,\\"sticky\\":null},\\"to\\":{\\"line\\":0,\\"ch\\":15,\\"sticky\\":null},\\"enType\\":\\"atom\\",\\"enText\\":\\"大豆进价\\",\\"enCode\\":\\"inprice\\"}]}","enText":"大豆利润","enCode":"profit"}]}',
    },
    {
      fullName: '玉米利润',
      value: 'string',
      enCode: 'yprofit',
      type: 'formula',
      formula:
        '{"text":"玉米总量*(玉米售价-玉米进价)","marks":[{"from":{"line":0,"ch":0,"sticky":null},"to":{"line":0,"ch":4,"sticky":null},"enType":"atom","enText":"玉米总量","enCode":"ytotal"},{"from":{"line":0,"ch":6,"sticky":null},"to":{"line":0,"ch":10,"sticky":null},"enType":"atom","enText":"玉米售价","enCode":"youtprice"},{"from":{"line":0,"ch":11,"sticky":null},"to":{"line":0,"ch":15,"sticky":null},"enType":"atom","enText":"玉米进价","enCode":"yinprice"}]}',
    },
    {
      fullName: '大豆利润',
      value: 'string',
      enCode: 'profit',
      type: 'formula',
      formula:
        '{"text":"大豆总量*(大豆售价-大豆进价)","marks":[{"from":{"line":0,"ch":0,"sticky":null},"to":{"line":0,"ch":4,"sticky":null},"enType":"atom","enText":"大豆总量","enCode":"total"},{"from":{"line":0,"ch":6,"sticky":null},"to":{"line":0,"ch":10,"sticky":null},"enType":"atom","enText":"大豆售价","enCode":"outprice"},{"from":{"line":0,"ch":11,"sticky":null},"to":{"line":0,"ch":15,"sticky":null},"enType":"atom","enText":"大豆进价","enCode":"inprice"}]}',
    },
    {
      fullName: '大豆进价',
      value: 'string',
      enCode: 'inprice',
      type: 'atom',
    },
    {
      fullName: '大豆售价',
      value: 'string',
      enCode: 'outprice',
      type: 'atom',
    },
    {
      fullName: '大豆总量',
      value: 'string',
      enCode: 'total',
      type: 'atom',
    },
    {
      fullName: '玉米进价',
      value: 'string',
      enCode: 'yinprice',
      type: 'atom',
    },
    {
      fullName: '玉米售价',
      value: 'string',
      enCode: 'youtprice',
      type: 'atom',
    },
    {
      fullName: '玉米总量',
      value: 'string',
      enCode: 'ytotal',
      type: 'atom',
    },
  ]
  const initFormData = () => {
    const obj = {}
    fieldList.forEach(item => {
      obj[item.enCode] = 0
    })
    return obj
  }
  export default {
    name: 'HomeView',
    components: {
      FormulaEditor,
    },
    data() {
      return {
        dialogVisible: false,
        formData: initFormData(),
        result: '',
        list: [],
        formulaConf: {},
        watchData: null,
        fieldList,
      }
    },
    computed: {
      nodes() {
        return this.list?.flatMap(o => o.formula) || []
      },
    },
    mounted() {
      this.list = formulaObj.map(ObjInstance => new ObjInstance())

      // 计算值 - 传入配置
      this.result = calculate({
        text: 'SUM(1,2,3,4,5,6,7,8,9,10)',
      })
    },
    methods: {
      handleShow() {
        this.dialogVisible = true
        const _self = this
        setTimeout(() => {
          _self.$refs.formulaEditor
            .getEditor()
            .renderData(JSON.parse(fieldList[0].formula))
        }, 0)
      },
      onConfirm() {
        // const data = this.$refs.formulaEditor.getData()
        // this.formulaConf = data
        this.dialogVisible = false
        // this.watchData?.()
        // // 自动监听form表单的值
        // this.watchData = formulaWatcher(
        //   this,
        //   { key: 'formData', value: this.formData },
        //   this.formulaConf,
        //   data => {
        //     this.result = data
        //   }
        // )
      },
      handleChange() {
        const formulaConf = this.$refs.formulaEditor.getData()
        this.result = calculate({
          value: this.formData,
          marks: formulaConf.marks,
          text: formulaConf.text,
        })
      },
      onCancel() {
        this.dialogVisible = false
      },
      resetFormula() {
        this.$refs.formulaEditor.reset()
      },
    },
  }
</script>

<style></style>
