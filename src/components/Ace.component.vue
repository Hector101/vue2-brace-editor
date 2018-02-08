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

  import 'brace/ext/language_tools';

  import { editorOptions } from '../lib//editorOptions';
  import propsValue from '../lib/props';

  const props = Object.assign({}, propsValue, {
      value: {
        type: String,
        default: ''
      },
      defaultValue: {
        type: String,
        default: '',
    }
  });

  export default {
    props,
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
    mounted() { // Mounted
      const {
        className,
        onBeforeLoad,
        onValidate,
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
        name,
      } = this.$props;

      this.editor = ace.edit(name);
      
      if (onBeforeLoad) {
        onBeforeLoad(ace);
      }

      const editorProps = Object.keys(this.$props.editorProps);

      for (let i = 0; i < editorProps.length; i++) {
        this.editor[editorProps[i]] = this.$props.editorProps[editorProps[i]];
      }
      if (this.$props.debounceChangePeriod) {
        this.onChangeUpdate = this.debounce(this.onChangeUpdate, this.$props.debounceChangePeriod);
      }
      this.editor.renderer.setScrollMargin(scrollMargin[0], scrollMargin[1], scrollMargin[2], scrollMargin[3])
      this.editor.getSession().setMode(`ace/mode/${mode}`);

      this.editor.setTheme(`ace/theme/${theme}`);
      this.editor.setFontSize(fontSize);
      this.editor.getSession().setValue(!defaultValue ? value : defaultValue, cursorStart);
      this.editor.navigateFileEnd()
      this.editor.renderer.setShowGutter(showGutter);
      this.editor.getSession().setUseWrapMode(wrapEnabled);
      this.editor.setShowPrintMargin(showPrintMargin);
      this.editor.on('focus', this.onFocusUpdate);
      this.editor.on('blur', this.onBlurUpdate);
      this.editor.on('copy', this.onCopyUpdate);
      this.editor.on('paste', this.onPasteUpdate);
      this.editor.on('change', this.onChangeUpdate);
      this.editor.on('input', this.onInputUpdate);
      this.editor.getSession().selection.on('changeSelection', this.selectionChange);
      this.editor.getSession().selection.on('changeCursor', this.cursorChange);

      if (onValidate) {
        this.editor.getSession().on('changeAnnotation', () => {
          const annotations = this.editor.getSession().getAnnotations();
          this.$props.onValidate(annotations);
        });
      }
      this.editor.session.on('changeScrollTop', this.onScrollUpdate);
      this.editor.getSession().setAnnotations(annotations || []);
      if(markers && markers.length > 0){
        this.handleMarkers(markers);
      }

      // get a list of possible options to avoid 'misspelled option errors'
      const availableOptions = this.editor.$options;
      for (let i = 0; i < editorOptions.length; i++) {
        const option = editorOptions[i];
        if (availableOptions.hasOwnProperty(option)) {
          this.editor.setOption(option, this.$props[option]);
        } else if (this.$props[option]) {
          console.warn(`VueAce: editor option ${option} was activated but not found. Did you need to import a related tool or did you possibly mispell the option?`)
        }
      }
      this.handleOptions(this.$props);

      if (Array.isArray(commands)) {
        commands.forEach((command) => {
          if(typeof command.exec == 'string') {
            this.editor.commands.bindKey(command.bindKey, command.exec);
          }
          else {
            this.editor.commands.addCommand(command);
          }
        });
      }

      if (keyboardHandler) {
        this.editor.setKeyboardHandler('ace/keyboard/' + keyboardHandler);
      }

      if (className) {
        this.refEditor.className += ' ' + className;
      }

      if (focus) {
        this.editor.focus();
      }

      if (onLoad) {
        onLoad(this.editor);
      }

      this.editor.resize();

      // Watch for props change
      this.$watch('$props', function(nextProps, prevProps) {
        for (let i = 0; i < editorOptions.length; i++) {
          const option = editorOptions[i];
          if (nextProps[option] !== prevProps[option]) {
            this.editor.setOption(option, nextProps[option]);
          }
        }

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

        if (nextProps.mode !== prevProps.mode) {
          this.editor.getSession().setMode('ace/mode/' + nextProps.mode);
        }
        if (nextProps.theme !== prevProps.theme) {
          this.editor.setTheme('ace/theme/' + nextProps.theme);
        }
        if (nextProps.keyboardHandler !== prevProps.keyboardHandler) {
          if (nextProps.keyboardHandler) {
            this.editor.setKeyboardHandler('ace/keyboard/' + nextProps.keyboardHandler);
          } else {
            this.editor.setKeyboardHandler(null);
          }
        }
        if (nextProps.fontSize !== prevProps.fontSize) {
          this.editor.setFontSize(nextProps.fontSize);
        }
        if (nextProps.wrapEnabled !== prevProps.wrapEnabled) {
          this.editor.getSession().setUseWrapMode(nextProps.wrapEnabled);
        }
        if (nextProps.showPrintMargin !== prevProps.showPrintMargin) {
          this.editor.setShowPrintMargin(nextProps.showPrintMargin);
        }
        if (nextProps.showGutter !== prevProps.showGutter) {
          this.editor.renderer.setShowGutter(nextProps.showGutter);
        }
        if (!isEqual(nextProps.setOptions, prevProps.setOptions)) {
          this.handleOptions(nextProps);
        }
        if (!isEqual(nextProps.annotations, prevProps.annotations)) {
          this.editor.getSession().setAnnotations(nextProps.annotations || []);
        }
        if (!isEqual(nextProps.markers, prevProps.markers) && (Array.isArray(nextProps.markers))) {
          this.handleMarkers(nextProps.markers);
        }

        // this doesn't look like it works at all....
        if (!isEqual(nextProps.scrollMargin, prevProps.scrollMargin)) {
          this.handleScrollMargins(nextProps.scrollMargin)
        }
        if (this.editor && this.editor.getValue() !== nextProps.value) {
          // editor.setValue is a synchronous function call, change event is emitted before setValue return.
          this.silent = true;
          const pos = this.editor.session.selection.toJSON();
          this.editor.setValue(nextProps.value, nextProps.cursorStart);
          this.editor.session.selection.fromJSON(pos);
          this.silent = false;
        }

        if (nextProps.focus && !prevProps.focus) {
          this.editor.focus();
        }

        if(prevProps.height !== nextProps.height || prevProps.width !== nextProps.width){
          this.editor.resize();
        }
      }, {
          deep: true
      })
    }, // Methods
    methods: {
      debounce(fn, delay) {
        var timer = null;
        return function () {
          var context = this, args = arguments;
          clearTimeout(timer);
          timer = setTimeout(function () {
            fn.apply(context, args);
          }, delay);
        };
      },
      handleScrollMargins(margins = [0, 0, 0, 0]) {
        this.editor.renderer.setScrollMargins(margins[0], margins[1], margins[2], margins[3]);
      },
      onChangeUpdate(event) {
        if (this.$props.onChange && !this.silent) {
          const value = this.editor.getValue();
          this.$props.onChange(value, event);
        }
      },
      selectionChange(event) {
        if (this.$props.onSelectionChange) {
          const value = this.editor.getSelection();
          this.$props.onSelectionChange(value, event);
        }
      },
      cursorChange(event) {
        if(this.$props.onCursorChange) {
          const value = this.editor.getSelection();
          this.$props.onCursorChange(value, event)
        }
      },
      onInputUpdate(event) {
        if (this.$props.onInput) {
          this.$props.onInput(event)
        }
      },
      onFocusUpdate(event) {
        if (this.$props.onFocus) {
          this.$props.onFocus(event);
        }
      },
      onBlurUpdate(event) {
        if (this.$props.onBlur) {
          this.$props.onBlur(event,this.editor);
        }
      },
      onCopyUpdate(text) {
        if (this.$props.onCopy) {
          this.$props.onCopy(text);
        }
      },
      onPasteUpdate(text) {
        if (this.$props.onPaste) {
          this.props.onPaste(text);
        }
      },
      onScrollUpdate() {
        if (this.$props.onScroll) {
          this.$props.onScroll(this.editor);
        }
      },
      handleOptions(props) {
        const setOptions = Object.keys(props.setOptions);
        for (let y = 0; y < setOptions.length; y++) {
          this.editor.setOption(setOptions[y], props.setOptions[setOptions[y]]);
        }
      },
      handleMarkers(markers) {
        // remove foreground markers
        let currentMarkers = this.editor.getSession().getMarkers(true);
        for (const i in currentMarkers) {
          if (currentMarkers.hasOwnProperty(i)) {
            this.editor.getSession().removeMarker(currentMarkers[i].id);
          }
        }
        // remove background markers
        currentMarkers = this.editor.getSession().getMarkers(false);
        for (const i in currentMarkers) {
          if (currentMarkers.hasOwnProperty(i)) {
            this.editor.getSession().removeMarker(currentMarkers[i].id);
          }
        }
        // add new markers
        markers.forEach(({ startRow, startCol, endRow, endCol, className, type, inFront = false }) => {
          const range = new Range(startRow, startCol, endRow, endCol);
          this.editor.getSession().addMarker(range, className, type, inFront);
        });
      },
    },
    beforeDestroy() {
      this.editor.destroy();
      this.editor = null;
    },
  }
</script>
