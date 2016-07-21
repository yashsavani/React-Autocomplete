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

    this.hashtaglist = [ "United States", "China", "Japan", "Germany", "United Kingdom", "France", "India", "Italy", "Brazil", "Canada", "South Korea", "Russia", "Australia", "Spain", "Mexico"];
    this.personlist = [ "David", "Barbara", "Philip", "Judy", "Virginia", "Martin", "Roger", "Frances", "Janet", "Michelle"];

    this.state = {editorState: EditorState.createEmpty(decorator), autoState: 'default', selectedId: 0, activelist: []};
    this.matchString = '';
    this.onChange = (editorState) => { this.setState({editorState}); };
  }

  returnToDefault() {
    this.setState({autoState: 'default', activelist: []});
  }

  getSelectedOption(autoState, selectedId, activelist) {
    if (autoState != 'default') {
      return (autoState=='person'?'@':'#')+activelist[selectedId];
    }
  }

  updateEditor(str){
    let { editorState } = this.state;
    const { autoState } = this.state;

    const content = editorState.getCurrentContent();
    const selection = editorState.getSelection();
    const block = content.getBlockForKey(selection.getAnchorKey());
    const entityKey = Entity.create(autoState, 'IMMUTABLE', {name: str});
    const replaced = Modifier.replaceText(
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
    editorState = EditorState.push(editorState, replaced, 'replace-text');
    this.setState({editorState});
  }

  handleTab(e) {
    const { autoState, activelist, selectedId} = this.state;
    if (autoState != 'default') {
      const selectedOption = this.getSelectedOption(autoState, selectedId, activelist);
      this.updateEditor(selectedOption);

      e.preventDefault();
      this.returnToDefault();
    }
  }

  handleReturn(e) {
    const { autoState, activelist, selectedId} = this.state;
    if (autoState != 'default') {
      const selectedOption = this.getSelectedOption(autoState, selectedId, activelist);
      this.updateEditor(selectedOption);

      e.preventDefault();
      this.returnToDefault();
      return true;
    }
    return false;
  }


  handleKeyCommand(command) { // Backspace
    const { autoState } = this.state;

    if (command == 'backspace') {
      if (autoState != 'default'){
        if (this.matchString == '') {
          this.returnToDefault();
        }
        this.matchString = this.getMatchString().slice(0,-1);
        console.log(this.matchString);
        this.changeAutoPrefix();
      }
    }
    return false;
  }

  handleDownArrow(e) {
    const { selectedId, autoState, activelist } = this.state;
    const sid = Math.min(selectedId + 1, activelist.length-1);
    this.setState({selectedId: sid});
    e.preventDefault();
  }

  handleUpArrow(e) {
    const sid = Math.max(this.state.selectedId - 1, 0);
    this.setState({selectedId: sid});
    e.preventDefault();
  }

  changeAutoPrefix() {
    const { autoState } = this.state;

    if (autoState != 'default') {
      let potentiallist = [];

      if (autoState == 'hashtag') {
        potentiallist = this.hashtaglist.filter((x) =>
          x.toUpperCase().startsWith(this.matchString.toUpperCase()));
      } else {
        potentiallist = this.personlist.filter((x) =>
          x.toUpperCase().startsWith(this.matchString.toUpperCase()));
      }

      this.setState({
        selectedId: 0,
        activelist: potentiallist
      });
    }
  }

  getMatchString() {
    const { autoState, editorState } = this.state;
    const content = editorState.getCurrentContent();
    const selection = editorState.getSelection();
    const block = content.getBlockForKey(selection.getAnchorKey());
    const lookChar = autoState == 'person'?'@':'#';
    return block.getText().slice(block.getText().lastIndexOf(lookChar)+1, selection.getAnchorOffset());
  }

  handleKeyUp(str) {
    const { autoState, selectedId, activelist } = this.state;

    if (autoState == 'hashtag' && str == ' ') {
      const selectedOption = this.getSelectedOption(autoState, selectedId, activelist);
      this.updateEditor(selectedOption);
      this.returnToDefault();
      return true;
    }

    if (autoState != 'default') {
      this.matchString = this.getMatchString() + str;
      console.log(this.matchString);
      this.changeAutoPrefix();
    }

    if (str == '@') {
      console.log("person state");
      this.matchString = '';
      this.setState({autoState: 'person', selectedId: 0});
    } else if ( str == '#' ) {
      console.log("hashtag state");
      this.matchString = '';
      this.setState({autoState: 'hashtag', selectedId: 0});
    }
    return false;
  }

  render() {
    const { autoState, editorState, selectedId, activelist } = this.state;
    return (
            <div>
              <Editor
                editorState={editorState}
                onChange={this.onChange}
                onDownArrow={this.handleDownArrow.bind(this)}
                onUpArrow={this.handleUpArrow.bind(this)}
                onTab={this.handleTab.bind(this)}
                handleBeforeInput={this.handleKeyUp.bind(this)}
                handleKeyCommand={this.handleKeyCommand.bind(this)}
                handleReturn={this.handleReturn.bind(this)}
              />

              <AutoComplete
                autoState={autoState}
                selectedId={selectedId}
                activelist={activelist}
              />
            </div>
          );

  }
}

export default DraftEditor
