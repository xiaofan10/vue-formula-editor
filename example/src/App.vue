<template>
  <div id="app">
    <el-button type="text" @click="dialogVisible = true">配置公式</el-button>
    <el-form ref="form" :model="formData">
      <el-form-item label="大豆单价">
        <el-input v-model="formData.price"></el-input>
      </el-form-item>
      <el-form-item label="大豆总量">
        <el-input v-model="formData.total"></el-input>
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

  export default {
    name: 'HomeView',
    components: {
      FormulaEditor,
    },
    data() {
      return {
        dialogVisible: false,
        formData: {
          price: 0,
          total: 0,
        },
        result: '',
        list: [],
        formulaConf: {},
        watchData: null,
        fieldList: [
          {
            fullName: '大豆利润',
            value: 'string',
            enCode: 'profit',
            type: 'rule',
            formula:
              '{"text":"SUM(大豆总量,大豆总量)","marks":[{"from":{"line":0,"ch":4,"sticky":null},"to":{"line":0,"ch":8,"sticky":null},"enCode":"total"},{"from":{"line":0,"ch":9,"sticky":null},"to":{"line":0,"ch":13,"sticky":null},"enCode":"total"}]}', // 公式
          },
          {
            fullName: '大豆单价',
            value: 'string',
            enCode: 'price',
            type: 'atom',
          },
          {
            fullName: '大豆总量',
            value: 'string',
            enCode: 'total',
            type: 'atom',
          },
        ],
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
      onConfirm() {
        const data = this.$refs.formulaEditor.getData()
        this.formulaConf = data
        this.dialogVisible = false

        this.watchData?.()
        // 自动监听form表单的值
        this.watchData = formulaWatcher(
          this,
          { key: 'formData', value: this.formData },
          this.formulaConf,
          data => {
            this.result = data
          }
        )
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
