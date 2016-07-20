import React, { Component } from 'react';

class ListItem extends Component {
  constructor(props, context) {
    super(props, context);
  }

  render() {
    return (
        <li className={this.props.selected?'selected':null}>{this.props.listValue[1]}</li>
    )
  }
}

export default ListItem
