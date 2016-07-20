import React, { Component } from 'react';
import {Editor, EditorState, getDefaultKeyBinding} from 'draft-js';
import AutoComplete from './AutoComplete'

function myKeyBindingFn(e: SyntheticKeyboardEvent): string {
  if (e.keyCode == 13) { // Return Key
    return 'return'
  }
  return getDefaultKeyBinding(e);
}

class DraftEditor extends Component {
  constructor(props, context) {
    super(props, context);

    this.hashlist = [ "United States", "China", "Japan", "Germany", "United Kingdom", "France", "India", "Italy", "Brazil", "Canada", "South Korea", "Russia", "Australia", "Spain", "Mexico"];

    this.atlist = [ "David", "Barbara", "Philip", "Judy", "Virginia", "Martin", "Roger", "Frances", "Janet", "Michelle"];


    this.state = {editorState: EditorState.createEmpty(), autoState: 'default', selectedId: 0, hashlist: this.hashlist, atlist: this.atlist};

    this.currtext = '';
    this.autostart = '';
    this.lastState = 'default';

    this.onChange = (editorState) => {
      const text = editorState.getCurrentContent().getLastBlock().getText();
      this.stateChange(text);
      this.changeAutoStr(text);
      this.setState({editorState});
    };

  }

  downKeyPress(e) {
    const { selectedId, autoState } = this.state;
    const listlen = autoState == 'hash'?this.liveHashlist.length:this.liveAtlist.length;
    const sid = Math.min(selectedId + 1, listlen-1);
    this.setState({selectedId: sid});
    e.preventDefault();
  }

  upKeyPress(e) {
    const sid = Math.max(this.state.selectedId - 1, 0);
    this.setState({selectedId: sid});
    e.preventDefault();
  }

  tabDown(e) {
    const { autoState, hashlist, atlist, selectedId} = this.state;
    if (autoState != 'default') {
      e.preventDefault();
      this.setState({autoState: 'default'});

      if (autoState == 'hash') {
        console.log(hashlist[selectedId]);
      } else if (autoState == 'at') {
        console.log(atlist[selectedId]);
      }

    }
  }

  handleReturn(command: string): boolean {
    const { autoState } = this.state;
    if (command == 'return') {
      if (autoState != 'default') {
        this.setState({autoState: 'default'});
      }
      return true
    }
    return false
  }

  getDifference(a, b) {
    let i = 0;
    let j = 0;
    let result = "";
    while (j < b.length) {
        if (a[i] != b[j] || i == a.length) 
          result += b[j];
        else 
          i++;
        j++;
    }
    return result;
  }

  changeAutoStr(autostr) {
    const { autoState } = this.state;
    const prefix = this.getDifference(this.autostart, autostr);
    console.log(prefix);

    if (autoState != 'default') {
      this.liveHashlist = this.hashlist.filter((x) =>
          x.toUpperCase().startsWith(prefix.toUpperCase()));
      this.liveAtlist = this.atlist.filter((x) =>
          x.toUpperCase().startsWith(prefix.toUpperCase()));

      this.setState({
        selectedId: 0,
        hashlist: this.liveHashlist,
        atlist: this.liveAtlist
      });
    }
  }


  stateChange(text) {
    const { autoState } = this.state;
    const diff = this.getDifference(this.currtext, text); 
    let currstate = '';

    if (diff == '@') {
      console.log('Just typed @.');

      currstate = 'at';
      this.setState({autoState: currstate});
    } else if (diff == '#'){
      console.log('Just typed #.');

      currstate = 'hash';
      this.setState({autoState: currstate});
    }

    if (currstate != this.lastState && currstate != 'default') {
      this.autostart = this.currtext;
    }

    this.currtext = text;
    this.lastState = currstate;
  }

  render() {
    const { autoState, editorState, selectedId, atlist, hashlist } = this.state;
    return (
            <div>
              <Editor editorState={editorState} onChange={this.onChange} onDownArrow={this.downKeyPress.bind(this)} onUpArrow={this.upKeyPress.bind(this)} onTab={this.tabDown.bind(this)} keyBindingFn={myKeyBindingFn} handleKeyCommand={this.handleReturn.bind(this)}/>
              <AutoComplete autoState={autoState} selectedId={selectedId} hashlist={hashlist} atlist={atlist}/>
            </div>
          );

  }
}

export default DraftEditor
