import React, { Component } from 'react';
import ImageSegmentation from './image-segmentation.js';
import './App.css';
import queryString from 'query-string';

class App extends Component {
  render() {
    const parsedQuery = queryString.parse(window.location.search);

    const polygons = parsedQuery.polygons
    const imageUrl = parsedQuery.imageUrl
    const submitTo = parsedQuery.submitTo
    const assignmentId = parsedQuery.assignmentId

    const signature = <input type="hidden" name="assignmentId" value={assignmentId} />;


    return (
      <div className="App">
      <form action={submitTo}>
        <ImageSegmentation polygons={polygons} imageUrl={imageUrl}/>
        {signature}
        <input type="submit" value="Submit"/>
      </form>
      </div>
    );
  }
}

export default App;
