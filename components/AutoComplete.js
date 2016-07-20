import React, { Component } from 'react';
import ListItem from './ListItem'


class AutoComplete extends Component {
  constructor(props, context) {
    super(props, context);
  }

  render() {

    let opts = [];
    if (this.props.autoState == 'hash') {
      this.props.hashlist.forEach((el,i,arr) => opts.push([i,el]))
    } else if (this.props.autoState == 'at') {
      this.props.atlist.forEach((el,i,arr) => opts.push([i,el]))
    } else {
      opts = [];
    }

    return (
        <div>
          <div>{this.props.autoState}</div>
          <div id="autobox" className={this.props.autoState}>
            <ul>
              {opts.map((listValue) => <ListItem key={listValue[0]} listValue={listValue} selected={listValue[0] == this.props.selectedId} />)}
            </ul>
          </div>
        </div>
    )
  }
}

export default AutoComplete
