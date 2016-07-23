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

function findPerson(contentBlock, callback) {
  contentBlock.findEntityRanges(
      (character) => {
        const entityKey = character.getEntity();
        return (entityKey !== null && Entity.get(entityKey).getType() === 'person');
      },
      callback
    );
}

function findHashtag(contentBlock, callback) {
  contentBlock.findEntityRanges(
      (character) => {
        const entityKey = character.getEntity();
        return (entityKey !== null && Entity.get(entityKey).getType() === 'hashtag');
      },
      callback
    );
}

const PersonSpan = (props) => {
  return <span style={styles.person}>{props.children}</span>;
};

const HashtagSpan = (props) => {
  return <span style={styles.hashtag}>{props.children}</span>;
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
    this.onTab = this.handleTab.bind(this);
    this.handleBeforeInput = this.handleTextInput.bind(this);
    this.handleKeyCommand = this.handleKeyCommand.bind(this);
    this.handleReturn = this.handleReturn.bind(this);
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

  updateEditor(str){
    let { editorState } = this.state;
    const { autocompleteMode } = this.state;

    const content = editorState.getCurrentContent();
    const selection = editorState.getSelection();
    const block = content.getBlockForKey(selection.getAnchorKey());
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
    editorState = EditorState.push(editorState, replaceWithMatchString, 'replace-text');
    this.setState({editorState});
  }

  handleTab(e) {
    const { autocompleteMode, activelist, selectedId} = this.state;
    if (autocompleteMode != 'default') {
      const selectedOption = this.getSelectedOption();
      this.updateEditor(selectedOption);

      e.preventDefault();
      this.returnToDefault();
    }
  }

  handleReturn(e) {
    const { autocompleteMode, activelist, selectedId} = this.state;
    if (autocompleteMode != 'default') {
      const selectedOption = this.getSelectedOption(autocompleteMode, selectedId, activelist);
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

  handleDownArrow(e) {
    const { selectedId, autocompleteMode, activelist } = this.state;
    const sid = Math.min(selectedId + 1, activelist.length-1);
    this.setState({selectedId: sid});
    e.preventDefault();
  }

  handleUpArrow(e) {
    const sid = Math.max(this.state.selectedId - 1, 0);
    this.setState({selectedId: sid});
    e.preventDefault();
  }

  changeAutoPrefix(state='default') {
    const { autocompleteMode } = this.state;

    if (autocompleteMode != 'default' || state != 'default') {
      let potentialList = [];

      if (autocompleteMode == 'hashtag' || state == 'hashtag') {
        potentialList = this.hashtaglist.filter((x) =>
          x.toUpperCase().startsWith(this.matchString.toUpperCase()));
      } else {
        potentialList = this.personlist.filter((x) =>
          x.toUpperCase().startsWith(this.matchString.toUpperCase()));
      }

      if (this.matchString != '') {
        potentialList.unshift(this.matchString);
      }

      this.setState({
        selectedId: 0,
        activelist: potentialList
      });
    }
  }

  getMatchString() {
    const { autocompleteMode, editorState } = this.state;
    const content = editorState.getCurrentContent();
    const selection = editorState.getSelection();
    const text = content.getBlockForKey(selection.getAnchorKey()).text;
    const selectionLocation = selection.getAnchorOffset();
    this.matchString = text.slice(this.triggerLocation+1, selection.getAnchorOffset());
    return selectionLocation >= this.triggerLocation;
  }

  handleTextInput(str) {
    const { editorState, autocompleteMode, selectedId, activelist } = this.state;

    if (autocompleteMode == 'hashtag' && str == ' ') {
      const selectedOption = this.getSelectedOption(autocompleteMode, selectedId, activelist);
      this.updateEditor(selectedOption);
      this.returnToDefault();
      return true;
    }

    if (autocompleteMode != 'default') {
      if (this.getMatchString()) {
        this.matchString += str;
      } else {
        this.triggerLocation++;
      }
      this.changeAutoPrefix();
    }

    if (str == '@') {
      console.log("person state");
      this.matchString = '';
      this.setState({autocompleteMode: 'person'});
      this.changeAutoPrefix('person');

      const content = editorState.getCurrentContent();
      const selection = editorState.getSelection();
      this.triggerLocation = selection.getAnchorOffset();
    } else if ( str == '#' ) {
      console.log("hashtag state");
      this.matchString = '';
      this.setState({autocompleteMode: 'hashtag'});
      this.changeAutoPrefix('hashtag');

      const content = editorState.getCurrentContent();
      const selection = editorState.getSelection();
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
