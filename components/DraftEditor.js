import React, { Component } from 'react';
import {Editor, EditorState, getDefaultKeyBinding} from 'draft-js';

function myKeyBindingFn(e: SyntheticKeyboardEvent): string {
  if (e.keyCode == 50) { // @ symbol
    return 'at-symbol';
  } else if (e.keyCode == 51) { // # symbol
    return 'hash-symbol';
  }
  return getDefaultKeyBinding(e);
}

class DraftEditor extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {editorState: EditorState.createEmpty()};
    this.onChange = (editorState) => this.setState({editorState});
  }

  handleKeyCommand(command: string): boolean {
    console.log(command);
    if (command == "at-symbol") {
      console.log("The @ symbol was pressed!");
      console.log(this.state);
      return true;
    } else if (command == "hash-symbol") {
      console.log("The # symbol was pressed!");
      return true;
    }
    return false;
  }

  render() {
    const {editorState} = this.state;
    return (
            <div>
              <Editor
                editorState={editorState} 
                handleKeyCommand={this.handleKeyCommand.bind(this)}
                keyBindingFn={myKeyBindingFn}
                onChange={this.onChange}
                placeholder="Type text here."
              />
              <div className="autocomplete">Hello World!</div>
            </div>
          );

  }
}

export default DraftEditor
