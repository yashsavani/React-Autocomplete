import React, { Component } from 'react';
import {Editor, EditorState, SelectionState, Entity, Modifier, CompositeDecorator} from 'draft-js';
import AutoComplete from './AutoComplete'

function findMode(mode, contentBlock, callback) {
  contentBlock.findEntityRanges(
      (character) => {
        const entityKey = character.getEntity();
        return (entityKey !== null && Entity.get(entityKey).getType() === mode);
      },
      callback
    );
}

function findPerson(contentBlock, callback) {
  findMode('person', contentBlock, callback);
}

function findHashtag(contentBlock, callback) {
  findMode('hashtag', contentBlock, callback);
}

function findRelation(contentBlock, callback) {
  findMode('relation', contentBlock, callback);
}

function modeSpan(className, children) {
  return <span className={className}>{children}</span>;
}

const PersonSpan = (props) => {
  return modeSpan('person', props.children);
};

const HashtagSpan = (props) => {
  return modeSpan('hashtag', props.children);
};

const RelationSpan = (props) => {
  return modeSpan('relation', props.children);
};

class DraftEditor extends Component {

  constructor(props, context) {
    super(props, context);

    const decorator = new CompositeDecorator([
      {
        strategy: findPerson,
        component: PersonSpan,
      },
      {
        strategy: findHashtag,
        component: HashtagSpan,
      },
      {
        strategy: findRelation,
        component: RelationSpan,
      },
    ]);

    this.modeMap = {'person': '@', 'hashtag': '#', 'relation': '<>'};
    this.triggerMap = {'@':'person', '#':'hashtag', '<>':'relation'};
    this.hashtaglist = ["United-States", "China", "Japan", "Germany", "United-Kingdom", "France", "India", "Italy", "Brazil", "Canada", "South Korea", "Russia", "Australia", "Spain", "Mexico"];
    this.personlist = ["Yash Savani", "David", "Barbara", "Philip", "Judy", "Virginia", "Martin", "Roger", "Frances", "Janet", "Michelle"];
    this.relationlist = ["Sibling", "Uncle", "Aunt", "Parent", "Child"];

    this.state = {editorState: EditorState.createEmpty(decorator), autocompleteMode: 'default', selectedId: 0, activelist: [], boundingRect: [0,0,0,0]};
    this.matchString = '';
    this.onChange = (editorState) => {
      this.setState({editorState});
    };
    this.onDownArrow = this.handleDownArrow.bind(this);
    this.onUpArrow = this.handleUpArrow.bind(this);
    this.onTab = this.selectOption.bind(this);
    this.handleBeforeInput = this.handleTextInput.bind(this);
    this.handleKeyCommand = this.handleKeyCommand.bind(this);
    this.handleReturn = this.selectOption.bind(this);
  }

  componentDidMount() {
    this.refs.editor.focus();
  }

  returnToDefault() {
    this.matchString = '';
    this.setState({autocompleteMode: 'default', activelist: []});
  }


  getSelectedOption() {
    const { autocompleteMode, selectedId, activelist } = this.state;
    if (autocompleteMode != 'default') {
      return this.modeMap[autocompleteMode]+activelist[selectedId];
    }
  }

  getEditorStateProperties() {
    const { editorState } = this.state;
    const content = editorState.getCurrentContent();
    const selection = editorState.getSelection();
    const block = content.getBlockForKey(selection.getAnchorKey());
    const text = block.text;
    return { content, selection, block, text };

  }

  updateEditorWithAutocomplete(str){
    const { autocompleteMode } = this.state;
    const { content, selection, block } = this.getEditorStateProperties();
    const offset = autocompleteMode == 'relation'?2:1;

    const entityKey = Entity.create(autocompleteMode, 'IMMUTABLE', {name: str});
    const replaceWithMatchString = Modifier.replaceText(
          content,
          new SelectionState({
            anchorKey: block.getKey(),
            anchorOffset: selection.getEndOffset() - this.matchString.length - offset,
            focusKey: block.getKey(),
            focusOffset: selection.getEndOffset(),
            hasFocus: true
          }),
          str,
          null,
          entityKey
      );
    const newEditorState = EditorState.push(this.state.editorState, replaceWithMatchString, 'replace-text');
    this.setState({editorState:newEditorState});
  }

  selectOption(e) {
    const { autocompleteMode, activelist, selectedId} = this.state;
    if (autocompleteMode != 'default') {
      const selectedOption = this.getSelectedOption();
      this.updateEditorWithAutocomplete(selectedOption);

      e.preventDefault();
      this.returnToDefault();
      return true;
    }
    return false;
  }

  handleKeyCommand(command) {
    const { autocompleteMode } = this.state;
    if (command == 'backspace') {
      if (autocompleteMode != 'default'){
        if (this.setMatchString()) {
          if (this.matchString == '') {
            this.returnToDefault();
          } else {
            this.matchString = this.matchString.slice(0,-1);
          }
        } else {
          this.triggerLocation--;
        }
        this.changeAutoPrefix();
      }
    }
    return false;
  }

  handleArrow(e, direction) {
    const { selectedId, autocompleteMode, activelist } = this.state;
    const sid = Math.min(selectedId + direction, activelist.length-1);
    this.setState({selectedId: sid});
    e.preventDefault();
  }

  handleDownArrow(e) {
    this.handleArrow(e, 1);
  }

  handleUpArrow(e) {
    this.handleArrow(e, -1);
  }

  changeAutoPrefix(mode=undefined) {
    const { autocompleteMode } = this.state;
    const finMode = mode == undefined ? autocompleteMode : mode;

    if (finMode != 'default') {
      const listMap = {'hashtag': this.hashtaglist, 'person': this.personlist, 'relation': this.relationlist};
      const potentialList = listMap[finMode].filter((x) =>
          x.toUpperCase().startsWith(this.matchString.toUpperCase()));

      this.setState({
        selectedId: 0,
        activelist: this.matchString!= '' ? [this.matchString].concat(potentialList) : potentialList
      });
    }
  }

  setMatchString() {
    const { autocompleteMode } = this.state;
    const { selection, text } = this.getEditorStateProperties();
    const selectionLocation = selection.getAnchorOffset();
    this.matchString = text.slice(this.triggerLocation+1, selectionLocation);
    return selectionLocation >= this.triggerLocation;
  }

  handleTextInput(str) {
    const { editorState, autocompleteMode, selectedId, activelist } = this.state;

    if (autocompleteMode != 'default') {
      if (this.setMatchString()) {
        if (autocompleteMode == 'hashtag' && str == ' ') {
          this.selectOption({preventDefault: () => {}});
          return true;
        }
        this.matchString += str;
        this.changeAutoPrefix();
      } else {
        this.triggerLocation++;
      }
    }

    if (str == '@' || str == '#' || str == '>') {
      const { block, selection, text } = this.getEditorStateProperties();
      const selectionLocation = selection.getAnchorOffset();
      const prevChar = text.slice(selectionLocation-1, selectionLocation);

      if (selectionLocation > 0) {
        const entityKey = block.getEntityAt(selectionLocation-1);
        if (entityKey != null) {
          if (prevChar == '<' && str == '>') {
            return false;
          }
        }
      }

      if (prevChar != '<' && str == '>') {
        return false;
      }
      const mappedChar = str == '>'? '<>': str;
      console.log(`${this.triggerMap[mappedChar]} state`);
      this.matchmappedCharing = '';
      this.setState({autocompleteMode: this.triggerMap[mappedChar]});
      this.changeAutoPrefix(this.triggerMap[mappedChar]);
      this.triggerLocation = selection.getAnchorOffset();
    }

    setTimeout(() => {
      const selection = global.getSelection();
      const range = selection.getRangeAt(0);
      const boundingRect = range.getBoundingClientRect();
      const {top, right, bottom, left} = boundingRect;
      this.setState({boundingRect: [top, right, bottom, left]});
    },1);

    return false;
  }

  render() {
    const { autocompleteMode, editorState, selectedId, activelist, boundingRect } = this.state;
    return (
            <div className="content">
              <h4>To trigger the Autocomplete functionality, type '#' for hashtags, '@' for people or '&lt;&gt;' for relations.</h4>
              <Editor
                editorState={editorState}
                onChange={this.onChange}
                onDownArrow={this.onDownArrow}
                onUpArrow={this.onUpArrow}
                onTab={this.onTab}
                handleBeforeInput={this.handleBeforeInput}
                handleKeyCommand={this.handleKeyCommand}
                handleReturn={this.handleReturn}
                ref="editor"
              />

              <AutoComplete
                autocompleteMode={autocompleteMode}
                selectedId={selectedId}
                activelist={activelist}
                boundingRect={boundingRect}
              />
            </div>
          );
  }
}

export default DraftEditor
