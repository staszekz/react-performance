import makeFilterCitiesWorker from 'workerize!./filter-cities';

const { getItems } = new makeFilterCitiesWorker();

export { getItems };

/*
eslint
  import/no-webpack-loader-syntax: 0,
*/
