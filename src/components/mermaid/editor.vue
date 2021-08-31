<template lang="pug">
v-card.editor-card
  v-card-title.pl-0.py-0
    v-toolbar(dense, flat)
      v-toolbar-title Editor
      v-spacer
      v-btn(icon, @click='replaceAll')
        v-icon mdi-find-replace
      v-btn(
        icon,
        href='https://mermaid-js.github.io/mermaid/#/flowchart',
        target='_blank',
        rel='noopener'
      )
        v-icon mdi-help-circle-outline
      v-btn(icon, @click='$refs.fileElement.click()')
        v-icon mdi-cloud-upload-outline
      v-btn(icon, @click='exportContent')
        v-icon mdi-cloud-download-outline
  v-card-text#editor.pb-0
    .codemirror-container
    .error-container.py-2
      pre.error-list {{ errorOutput }}
  input(
    ref='fileElement',
    type='file',
    style='display: none',
    @change='importContent'
  )
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import CodeMirror from 'codemirror/lib/codemirror.js'
//import 'codemirror/mode/javascript/javascript.js'
import 'codemirror/addon/search/search.js'
import 'codemirror/addon/search/searchcursor.js'
import 'codemirror/addon/dialog/dialog.js'
import 'codemirror/addon/dialog/dialog.css'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/idea.css'

import debounce from 'un-debounce'
import FileSaver from 'file-saver'

@Component
export default class Editor extends Vue {
  name = 'Editor'
  value = ''
  editor = {
    instance: null as any,
  }
  @Prop({ default: () => [] })
  errors!: any[]

  @Watch('errors', { deep: true })
  onErrorsChanged(value: any[], oldValue: any[]) {
    this.editor.instance.getDoc().clearGutter('errors')

    const markerElement = document.createElement('span')
    markerElement.className = 'gutter-error'
    markerElement.innerHTML = '❌'
    for (let i = 0; i < this.errors.length; i++) {
      const error = this.errors[i]

      if (!error.hash) continue
      this.editor.instance
        .getDoc()
        .setGutterMarker(
          error.hash.line,
          'errors',
          markerElement.cloneNode(true),
        )
    }
  }
  get errorOutput() {
    if (this.errors.length > 0) {
      return this.errors
        .map((e) => e.str.split('\n').slice(0, 3).join('\n'))
        .join('\n')
    }

    return `
    
    `
  }
  replaceAll(){
    this.editor.instance.execCommand("replaceAll")
  }
  importContent(event) {
    const files = event.srcElement.files

    if (files && files[0]) {
      const reader = new FileReader()
      reader.onload = (data) => {
        const fileContent = data?.target?.result?.toString()
        if (fileContent != undefined) {
          this.value = fileContent
          this.editor.instance.doc.setValue(this.value)
        }
        ;(this.$refs.fileElement as HTMLInputElement).value = ''
      }
      reader.readAsText(files[0])
    }
  }
  exportContent() {
    const fileName = `${new Date().toISOString().substr(0, 10)} - export.txt`
    let blob = new Blob([this.value], {
      type: 'text/plain;charset=utf-8',
    })
    FileSaver.saveAs(blob, fileName)
  }
  initEditor() {
    const urlSearchParams = new URLSearchParams(window.location.search)
    const params = Object.fromEntries(urlSearchParams.entries())
    let initialCode = `
graph TD
A[Hard] -->|Text| B(Round)
B --> C{Decision}
C -->|One| D[Result 1]
C -->|Two| E[Result 2]`.trim()
    if (params.code) {
      initialCode = window.atob(decodeURIComponent(params.code))
    }
    this.editor.instance = CodeMirror(document.querySelector('#editor > div'), {
      value: initialCode,
      theme: 'idea',
      lineNumbers: true,
      gutters: ['errors'],
      lint: true,
      styleActiveLine: { nonEmpty: true },
      styleActiveSelected: true,
    })

    this.value = this.editor.instance.doc.getValue()
    this.$emit('input', this.value)
    this.editor.instance.on(
      'change',
      debounce((instance, changeObj) => {
        this.value = this.editor.instance.doc.getValue()
        this.$emit('input', this.value)
        this.updateUrl(this.value)
      }, 200),
    )
    this.$emit('editor', this.editor.instance)
  }

  updateUrl(code) {
    const urlSearchParams = new URLSearchParams(window.location.search)
    urlSearchParams.set('code', window.btoa(code.trim()))
    const newUrl =
      window.location.origin +
      window.location.pathname +
      '?' +
      urlSearchParams.toString() +
      window.location.hash

    if (newUrl !== window.location.toString())
      window.history.pushState({}, '', newUrl)
  }

  mounted() {
    this.initEditor()
  }
}
</script>
<style lang="stylus" scoped>
.editor-card
  display flex
  flex-direction column
  overflow hidden

#editor
  display flex
  flex 1
  flex-direction column
  height calc(100% - 70px)

  .codemirror-container
    flex 1 1 auto
    overflow auto

  .error-container
    height 70px

.error-list
  overflow auto
  color #a90101
  font-size small
  font-family monospace
  line-height normal
</style>

<style lang="stylus">
.gutter-error
  font-size x-small

.CodeMirror
  height 100%
  border 1px solid #f0f0f0

.CodeMirror-scroll
  padding-top 10px

.remote-caret
  position absolute
  margin-left -1px
  height 1.1em
  border-left black
  border-left-width 1.2px
  border-left-style solid
  font-family 'Roboto', sans-serif !important
  opacity 0.7

.remote-caret > div
  position relative
  top -1em
  z-index 3
  margin-left -1.2px
  padding 1px 5px
  background-color rgb(250, 129, 0)
  box-shadow 1px 1px 4px #666
  color white
  font-weight normal
  font-style normal
  font-size 0.7em
  font-family 'Roboto', sans-serif !important
  font-family serif
  line-height normal
  user-select none
</style>