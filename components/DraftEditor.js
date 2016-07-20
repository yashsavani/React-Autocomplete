import React, { Component } from 'react';
import {Editor, EditorState, getDefaultKeyBinding, RichUtils} from 'draft-js';
import AutoComplete from './AutoComplete'

class DraftEditor extends Component {
  constructor(props, context) {
    super(props, context);

    this.hashlist = [ "United States", "China", "Japan", "Germany", "United Kingdom", "France", "India", "Italy", "Brazil", "Canada", "South Korea", "Russia", "Australia", "Spain", "Mexico"];
    this.atlist = [ "David", "Barbara", "Philip", "Judy", "Virginia", "Martin", "Roger", "Frances", "Janet", "Michelle"];

    this.state = {editorState: EditorState.createEmpty(), autoState: 'default', selectedId: 0,  hashlist: this.hashlist, atlist: this.atlist};
    this.prefix = '';
    this.onChange = (editorState) => { this.setState({editorState}); };
  }

  returnToDefault() {
    this.setState({autoState: 'default'});
  }

  getSelected(autoState, selectedId, hashlist, atlist) {
    if (autoState != 'default') {
      if (autoState == 'hash') {
        return hashlist[selectedId];
      } else if (autoState == 'at') {
        return atlist[selectedId];
      }
    }
  }

  handleTab(e) {
    const { autoState, hashlist, atlist, selectedId} = this.state;
    const selected = this.getSelected(autoState, selectedId, hashlist, atlist);
    console.log(selected);

    if (autoState != 'default') {
      e.preventDefault();
      this.returnToDefault();
    }
  }

  handleReturn(e) {
    const { autoState, hashlist, atlist, selectedId} = this.state;
    const selected = this.getSelected(autoState, selectedId, hashlist, atlist);
    console.log(selected);

    if (autoState != 'default') {
      e.preventDefault();
      this.returnToDefault();
      return true;
    }

    return false;
  }


  handleKeyCommand(command) {
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
    const { selectedId, autoState, hashlist, atlist } = this.state;
    const listlen = autoState == 'hash'?hashlist.length:atlist.length;
    const sid = Math.min(selectedId + 1, listlen-1);
    this.setState({selectedId: sid});
    e.preventDefault();
  }

  handleUpArrow(e) {
    const sid = Math.max(this.state.selectedId - 1, 0);
    this.setState({selectedId: sid});
    e.preventDefault();
  }

  changeAutoPrefix() {
    this.liveHashlist = this.hashlist.filter((x) =>
        x.toUpperCase().startsWith(this.prefix.toUpperCase()));
    this.liveAtlist = this.atlist.filter((x) =>
        x.toUpperCase().startsWith(this.prefix.toUpperCase()));

    this.setState({
      selectedId: 0,
      hashlist: this.liveHashlist,
      atlist: this.liveAtlist
    });
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
    const { autoState, editorState, selectedId, atlist, hashlist } = this.state;
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
                hashlist={hashlist}
                atlist={atlist}
              />
            </div>
          );

  }
}

export default DraftEditor
