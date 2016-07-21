import React, { Component } from 'react'
import DraftEditor from './DraftEditor'

class App extends Component {
  render() {
    return (
      <div className="container">
        <h1 className="header">React Autocomplete</h1>
        <DraftEditor/>
      </div>
    )
  }
}

export default App
