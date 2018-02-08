<template>
  <div
  ref="editor"
  :id="getId"
  :style="divStyle"
  >
  </div>  
</template>

<script>
  import ace from 'brace';
  import isEqual from 'lodash/isequal';
  import get from 'lodash/get';
  

  import { editorOptions } from '../lib/editorOptions';
  import propsValue from '../lib/props';

  import 'brace/ext/split';
  import 'brace/ext/language_tools';

  const { Range } = ace.acequire('ace/range');
  const { Split } = ace.acequire('ace/split');

  export default {
    props: propsValue,
    computed: {
      divStyle() {
        const { width, height, style } = this.$props;
        const divStyle = { width, height, ...style };
        return divStyle;
      },
      getId() {
        const { name } = this.$props;
        return name;
      }
    },
    mounted() {
      const {
        className,
        onBeforeLoad,
        mode,
        focus,
        theme,
        fontSize,
        value,
        defaultValue,
        cursorStart,
        showGutter,
        wrapEnabled,
        showPrintMargin,
        scrollMargin,
        keyboardHandler,
        onLoad,
        commands,
        annotations,
        markers,
        splits,
        name,
      } = this.$props;

      this.editor = ace.edit(this.$refs.editor);

      if (onBeforeLoad) {
        onBeforeLoad(ace);
      }

      const editorProps = Object.keys(this.$props.editorProps);

      var split = new Split(this.editor.container,`ace/theme/${theme}`, splits);
      this.editor.env.split = split;

      this.splitEditor = split.getEditor(0);
      this.split = split;

      // in a split scenario we don't want a print margin for the entire application
      this.editor.setShowPrintMargin(false);
      this.editor.renderer.setShowGutter(false);
      // get a list of possible options to avoid 'misspelled option errors'
      const availableOptions = this.splitEditor.$options;
      split.forEach((editor, index) => {
        for (let i = 0; i < editorProps.length; i++) {
          editor[editorProps[i]] = this.$props.editorProps[editorProps[i]];
        }
        const defaultValueForEditor = get(defaultValue, index)
        const valueForEditor = get(value, index, '')
        editor.setTheme(`ace/theme/${theme}`);
        editor.renderer.setScrollMargin(scrollMargin[0], scrollMargin[1], scrollMargin[2], scrollMargin[3])
        editor.getSession().setMode(`ace/mode/${mode}`);
        editor.setFontSize(fontSize);
        editor.renderer.setShowGutter(showGutter);
        editor.getSession().setUseWrapMode(wrapEnabled);
        editor.setShowPrintMargin(showPrintMargin);
        editor.on('focus', this.onFocusUpdate);
        editor.on('blur', this.onBlurUpdate);
        editor.on('input', this.onInputUpdate);
        editor.on('copy', this.onCopyUpdate);
        editor.on('paste', this.onPasteUpdate);
        editor.on('change', this.onChangeUpdate);
        editor.getSession().selection.on('changeSelection', this.selectionChange);
        editor.getSession().selection.on('changeCursor', this.cursorChange);
        editor.session.on('changeScrollTop', this.onScrollUpdate);
        editor.setValue(defaultValueForEditor === undefined ? valueForEditor : defaultValueForEditor, cursorStart);
        const newAnnotations = get(annotations, index, [])
        const newMarkers = get(markers, index, [])
        editor.getSession().setAnnotations(newAnnotations);
        if(newMarkers && newMarkers.length > 0){
          this.handleMarkers(newMarkers,editor);
        }

        for (let i = 0; i < editorOptions.length; i++) {
          const option = editorOptions[i];
          if (availableOptions.hasOwnProperty(option)) {
            editor.setOption(option, this.$props[option]);
          } else if (this.$props[option]) {
            console.warn(`VueAce: editor option ${option} was activated but not found. Did you need to import a related tool or did you possibly mispell the option?`)
          }
        }
        this.handleOptions(this.$props, editor);

        if (Array.isArray(commands)) {
          commands.forEach((command) => {
            if(typeof command.exec == 'string') {
              editor.commands.bindKey(command.bindKey, command.exec);
            }
            else {
              editor.commands.addCommand(command);
            }
          });
        }

        if (keyboardHandler) {
          editor.setKeyboardHandler('ace/keyboard/' + keyboardHandler);
        }
      })

      if (className) {
        this.refEditor.className += ' ' + className;
      }

      if (focus) {
        this.splitEditor.focus();
      }

      const sp = this.editor.env.split;
      sp.setOrientation( this.$props.orientation === 'below' ? sp.BELOW : sp.BESIDE);
      sp.resize(true)
      if (onLoad) {
        onLoad(sp);
      }

      this.$watch('$props', function (nextProps, prevProps) {
        const split = this.editor.env.split

        if (nextProps.splits !== prevProps.splits) {
          split.setSplits(nextProps.splits)
        }

        if (nextProps.orientation !== prevProps.orientation) {
          split.setOrientation( nextProps.orientation === 'below' ? split.BELOW : split.BESIDE);
        }

        split.forEach((editor, index) => {

          if (nextProps.mode !== prevProps.mode) {
            editor.getSession().setMode('ace/mode/' + nextProps.mode);
          }
          if (nextProps.keyboardHandler !== prevProps.keyboardHandler) {
            if (nextProps.keyboardHandler) {
              editor.setKeyboardHandler('ace/keyboard/' + nextProps.keyboardHandler);
            } else {
              editor.setKeyboardHandler(null);
            }
          }
          if (nextProps.fontSize !== prevProps.fontSize) {
            editor.setFontSize(nextProps.fontSize);
          }
          if (nextProps.wrapEnabled !== prevProps.wrapEnabled) {
            editor.getSession().setUseWrapMode(nextProps.wrapEnabled);
          }
          if (nextProps.showPrintMargin !== prevProps.showPrintMargin) {
            editor.setShowPrintMargin(nextProps.showPrintMargin);
          }
          if (nextProps.showGutter !== prevProps.showGutter) {
            editor.renderer.setShowGutter(nextProps.showGutter);
          }

          for (let i = 0; i < editorOptions.length; i++) {
            const option = editorOptions[i];
            if (nextProps[option] !== prevProps[option]) {
              editor.setOption(option, nextProps[option]);
            }
          }
          if (!isEqual(nextProps.setOptions, prevProps.setOptions)) {
            this.handleOptions(nextProps, editor);
          }
          const nextValue = get(nextProps.value, index, '')
          if (editor.getValue() !== nextValue) {
            // editor.setValue is a synchronous function call, change event is emitted before setValue return.
            this.silent = true;
            const pos = editor.session.selection.toJSON();
            editor.setValue(nextValue, nextProps.cursorStart);
            editor.session.selection.fromJSON(pos);
            this.silent = false;
          }
          const newAnnotations = get(nextProps.annotations, index, [])
          const oldAnnotations = get(prevProps.annotations, index, [])
          if (!isEqual(newAnnotations, oldAnnotations)) {
            editor.getSession().setAnnotations(newAnnotations);
          }

          const newMarkers = get(nextProps.markers, index, [])
          const oldMarkers = get(prevProps.markers, index, [])
          if (!isEqual(newMarkers, oldMarkers) && Array.isArray(newMarkers)) {
            this.handleMarkers(newMarkers, editor);
          }

        })

        if (nextProps.className !== prevProps.className) {
          let appliedClasses = this.refEditor.className;
          let appliedClassesArray = appliedClasses.trim().split(' ');
          let oldClassesArray = prevProps.className.trim().split(' ');
          oldClassesArray.forEach((oldClass) => {
            let index = appliedClassesArray.indexOf(oldClass);
            appliedClassesArray.splice(index, 1);
          });
          this.refEditor.className = ' ' + nextProps.className + ' ' + appliedClassesArray.join(' ');
        }

        if (nextProps.theme !== prevProps.theme) {
          split.setTheme('ace/theme/' + nextProps.theme);
        }

        if (nextProps.focus && !prevProps.focus) {
          this.splitEditor.focus();
        }
        if(nextProps.height !== prevProps.height || nextProps.width !== prevProps.width) {
          this.editor.resize();
        }
      }, {
        deep: true,
      })
    },
    methods: {
      onChangeUpdate(event) {
        if (this.$props.onChange && !this.silent) {
          let value = []
          this.editor.env.split.forEach((editor) => {
            value.push(editor.getValue())
          })
          this.$props.onChange(value, event);
        }
      },
      selectionChange(event) {
        if (this.$props.onSelectionChange) {
          let value = []
          this.editor.env.split.forEach((editor) => {
            value.push(editor.getSelection())
          })
          this.$props.onSelectionChange(value, event);
        }
      },
      cursorChange(event) {
        if(this.$props.onCursorChange) {
          let value = []
          this.editor.env.split.forEach((editor) => {
            value.push(editor.getSelection())
          })
          this.$props.onCursorChange(value, event)
        }
      },
      onFocusUpdate(event) {
        if (this.$props.onFocus) {
          this.$props.onFocus(event);
        }
      },
      onInputUpdate(event) {
        if (this.$props.onInput) {
          this.$props.onInput(event);
        }
      },
      onBlurUpdate(event) {
        if (this.$props.onBlur) {
          this.$props.onBlur(event);
        }
      },
      onCopyUpdate(text) {
        if (this.$props.onCopy) {
          this.$props.onCopy(text);
        }
      },
      onPasteUpdate(text) {
        if (this.$props.onPaste) {
          this.$props.onPaste(text);
        }
      },
      onScrollUpdate() {
        if (this.$props.onScroll) {
          this.$props.onScroll(this.editor);
        }
      },
      handleOptions(props, editor) {
        const setOptions = Object.keys(props.setOptions);
        for (let y = 0; y < setOptions.length; y++) {
          editor.setOption(setOptions[y], props.setOptions[setOptions[y]]);
        }
      },
      handleMarkers(markers, editor) {
        // remove foreground markers
        let currentMarkers = editor.getSession().getMarkers(true);
        for (const i in currentMarkers) {
          if (currentMarkers.hasOwnProperty(i)) {
            editor.getSession().removeMarker(currentMarkers[i].id);
          }
        }
        // remove background markers
        currentMarkers = editor.getSession().getMarkers(false);
        for (const i in currentMarkers) {
          if (currentMarkers.hasOwnProperty(i)) {
            editor.getSession().removeMarker(currentMarkers[i].id);
          }
        }
        // add new markers
        markers.forEach(({ startRow, startCol, endRow, endCol, className, type, inFront = false }) => {
          const range = new Range(startRow, startCol, endRow, endCol);
          editor.getSession().addMarker(range, className, type, inFront);
        });
      },
    },
    beforeDestroy() {
      this.editor.destroy();
      this.editor = null;
    }
  }
</script>
