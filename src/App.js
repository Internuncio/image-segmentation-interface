import React, { Component } from 'react';
import ImageSegmentation from './image-segmentation.js';
import './App.css';
import queryString from 'qs';

class App extends Component {
  render() {
    const parsedQuery = queryString.parse(window.location.search, { ignoreQueryPrefix: true });

    const polygons = parsedQuery.polygons
    const imageUrl = parsedQuery.imageUrl
    const submitTo = parsedQuery.submitTo
    const assignmentId = parsedQuery.assignmentId

    const signature = <input type="hidden" name="assignmentId" value={assignmentId} />;
    const rails_patch_field = <input type="hidden" name="_method" value="patch" />;


    return (
      <div className="App">
      <form action={submitTo} method="POST">
        <ImageSegmentation polygons={polygons} imageUrl={imageUrl}/>
        {rails_patch_field}
        {signature}
        <input type="submit" value="Submit"/>
      </form>
      </div>
    );
  }
}

export default App;
