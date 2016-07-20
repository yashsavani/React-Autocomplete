import React, { Component } from 'react';
import {Editor, EditorState, SelectionState, Entity, Modifier} from 'draft-js';
import AutoComplete from './AutoComplete'

class DraftEditor extends Component {
  constructor(props, context) {
    super(props, context);

    this.hashlist = [ "United States", "China", "Japan", "Germany", "United Kingdom", "France", "India", "Italy", "Brazil", "Canada", "South Korea", "Russia", "Australia", "Spain", "Mexico"];
    this.atlist = [ "David", "Barbara", "Philip", "Judy", "Virginia", "Martin", "Roger", "Frances", "Janet", "Michelle"];

    this.state = {editorState: EditorState.createEmpty(), autoState: 'default', selectedId: 0, activelist: []};
    this.prefix = '';
    this.onChange = (editorState) => { this.setState({editorState}); };
  }

  returnToDefault() {
    this.setState({autoState: 'default', activelist: []});
  }

  getSelected(autoState, selectedId, activelist) {
    if (autoState != 'default') {
      return (autoState=='at'?'@':'#')+activelist[selectedId];
    }
  }

  handleTab(e) {
    let { editorState } = this.state;
    const { autoState, activelist, selectedId} = this.state;
    const selected = this.getSelected(autoState, selectedId, activelist);
    console.log(selected);
    this.updateEditor(selected);

    if (autoState != 'default') {
      e.preventDefault();
      this.returnToDefault();
    }
  }

  updateEditor(str){
    let { editorState } = this.state;
    const { autoState  } = this.state;

    const content = editorState.getCurrentContent();
    const selection = editorState.getSelection();
    const block = content.getBlockForKey(selection.getAnchorKey());
    const text = block.getText().slice(0, selection.getEndOffset());
    console.log(text);
    console.log(this.prefix);
    const entityKey = Entity.create(autoState, 'IMMUTABLE', {name: str});
    const replaced = Modifier.replaceText(
          content,
          new SelectionState({
            anchorKey: block.getKey(),
            anchorOffset: selection.getEndOffset() - this.prefix.length - 1,
            focusKey: block.getKey(),
            focusOffset: selection.getEndOffset()
          }),
          str,
          null,
          entityKey
        );
    editorState = EditorState.push(
          editorState,
          replaced,
          'replace-text'
        )
      this.setState({editorState});
  }

  handleReturn(e) {
    const { autoState, activelist, selectedId} = this.state;
    const selected = this.getSelected(autoState, selectedId, activelist);
    console.log(selected);
    this.updateEditor(selected);

    if (autoState != 'default') {
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
        if (this.prefix == '') {
          this.returnToDefault();
        }
        this.prefix = this.prefix.slice(0,-1);
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

      if (autoState == 'hash') {
        potentiallist = this.hashlist.filter((x) =>
          x.toUpperCase().startsWith(this.prefix.toUpperCase()));
      } else {
        potentiallist = this.atlist.filter((x) =>
          x.toUpperCase().startsWith(this.prefix.toUpperCase()));
      }

      this.setState({
        selectedId: 0,
        activelist: potentiallist
      });
    }
  }

  handleKeyUp(str) {
    const { autoState } = this.state;

    if (autoState != 'default') {
      console.log(this.prefix);
      this.prefix += str;
      this.changeAutoPrefix();
    }

    if (str == '@') {
      console.log("at state");
      this.prefix = '';
      this.setState({autoState: 'at', selectedId: 0});
    } else if ( str == '#' ) {
      console.log("hash state");
      this.prefix = '';
      this.setState({autoState: 'hash', selectedId: 0});
    }

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
