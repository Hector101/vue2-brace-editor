# Vue2-Brace-Editor


A Vue components for Ace / Brace

## Install

`npm install vue2-brace-editor`

## Basic Usage

```javascript

<template>
  // Full editor component
  <AceEditor
    :fontSize="14"
    :showPrintMargin="true"
    :showGutter="true"
    :highlightActiveLine="true"
    mode="javascript"
    theme="monokai"
    :onChange="onChange"
    name="editor"
    :editorProps="{$blockScrolling: true}"
  />

  // Split editor component
   <SplitEditor
    mode="javascript"
    theme="monokai"
    :splits="2"
    orientation="beside"
    name="editor"
    :editorProps="{$blockScrolling: true}"
  />
</template>

<script>
  import Vue from 'vue';
  import brace from 'brace';
  import { Ace as AceEditor, Split as SplitEditor } from 'vue2-brace-editor';

  import 'brace/mode/javascript';
  import 'brace/theme/monokai';

  export default {
    components: {
      AceEditor,
      SplitEditor,
    },
    $el: 'root',
    methods: {
      onChange(newValue) {
        console.log('change',newValue);
      }
    }
  }
</script>

```