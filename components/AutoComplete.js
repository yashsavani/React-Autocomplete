import React, { Component } from 'react';
import ListItem from './ListItem'


class AutoComplete extends Component {
  constructor(props, context) {
    super(props, context);
  }

  render() {
    let opts = [];
    this.props.activelist.forEach((el,i,arr) => opts.push([i,el]))

    return (
        <div className="nav">
          <div id="autobox" className={this.props.autocompleteMode}>
            <ul>
              {opts.map((listValue) => <ListItem key={listValue[0]} listValue={listValue} selected={listValue[0] == this.props.selectedId} />)}
            </ul>
          </div>
        </div>
    )
  }
}

export default AutoComplete
