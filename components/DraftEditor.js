import React, { Component } from 'react';
import {Editor, EditorState, SelectionState, Entity, Modifier, CompositeDecorator} from 'draft-js';
import AutoComplete from './AutoComplete'

const styles = {
  person: {
    color: 'red',
  },
  hashtag: {
    color: 'green',
  },
};

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

function modeSpan(styles, children) {
  return <span style={styles}>{children}</span>;
}

const PersonSpan = (props) => {
  return modeSpan(styles.person, props.children);
};

const HashtagSpan = (props) => {
  return modeSpan(styles.hashtag, props.children);
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
    ]);

    this.hashtaglist = [ "United-States", "China", "Japan", "Germany", "United-Kingdom", "France", "India", "Italy", "Brazil", "Canada", "South Korea", "Russia", "Australia", "Spain", "Mexico"];
    this.personlist = [ "Yash Savani", "David", "Barbara", "Philip", "Judy", "Virginia", "Martin", "Roger", "Frances", "Janet", "Michelle"];

    this.state = {editorState: EditorState.createEmpty(decorator), autocompleteMode: 'default', selectedId: 0, activelist: []};
    this.matchString = '';
    this.onChange = (editorState) => { this.setState({editorState}); };
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
    this.setState({autocompleteMode: 'default', activelist: []});
  }

  getSelectedOption() {
    const { autocompleteMode, selectedId, activelist } = this.state;
    if (autocompleteMode != 'default') {
      return (autocompleteMode=='person'?'@':'#')+activelist[selectedId];
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

  updateEditor(str){
    const { autocompleteMode } = this.state;
    const { content, selection, block } = this.getEditorStateProperties();

    const entityKey = Entity.create(autocompleteMode, 'IMMUTABLE', {name: str});
    const replaceWithMatchString = Modifier.replaceText(
          content,
          new SelectionState({
            anchorKey: block.getKey(),
            anchorOffset: selection.getEndOffset() - this.matchString.length - 1,
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
      this.updateEditor(selectedOption);

      e.preventDefault();
      this.returnToDefault();
      return true;
    }
    return false;
  }

  handleKeyCommand(command) { // Backspace
    const { autocompleteMode } = this.state;
    if (command == 'backspace') {
      if (autocompleteMode != 'default'){
        if (this.getMatchString()) {
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

  changeAutoPrefix(state='default') {
    const { autocompleteMode } = this.state;

    if (autocompleteMode != 'default' || state != 'default') {
      const modeList = autocompleteMode == 'hashtag' || state == 'hashtag' ? this.hashtaglist : this.personlist;
      const potentialList = modeList.filter((x) =>
          x.toUpperCase().startsWith(this.matchString.toUpperCase()));

      this.setState({
        selectedId: 0,
        activelist: this.matchString!= '' ? [this.matchString].concat(potentialList) : potentialList
      });
    }
  }

  getMatchString() {
    const { autocompleteMode, editorState } = this.state;
    const { content, selection, text } = this.getEditorStateProperties();
    const selectionLocation = selection.getAnchorOffset();
    this.matchString = text.slice(this.triggerLocation+1, selection.getAnchorOffset());
    return selectionLocation >= this.triggerLocation;
  }

  handleTextInput(str) {
    const { editorState, autocompleteMode, selectedId, activelist } = this.state;

    if (autocompleteMode != 'default') {
      if (this.getMatchString()) {
        if (autocompleteMode == 'hashtag' && str == ' ') {
          this.selectOption({preventDefault: () => {}});
          return true;
        }
        this.matchString += str;
      } else {
        this.triggerLocation++;
      }
      this.changeAutoPrefix();
    }

    const triggerChar = str=='@'?'person':'hashtag';

    if(str == '@' || str == '#') {
      console.log(`${triggerChar} state`);
      this.matchString = '';
      this.setState({autocompleteMode: triggerChar});
      this.changeAutoPrefix(triggerChar);
      const { content, selection } = this.getEditorStateProperties();
      this.triggerLocation = selection.getAnchorOffset();
    }
    return false;
  }

  render() {
    const { autocompleteMode, editorState, selectedId, activelist } = this.state;
    return (
            <div className="content">
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
              />
            </div>
          );

  }
}

export default DraftEditor
