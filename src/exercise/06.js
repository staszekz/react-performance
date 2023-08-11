// Fix "perf death by a thousand cuts"
// http://localhost:3000/isolated/exercise/06.js

import * as React from 'react';
import {
  useForceRerender,
  useDebouncedState,
  AppGrid,
  updateGridState,
  updateGridCellState,
} from '../utils';

const AppStateContext = React.createContext();
const AppDispatchContext = React.createContext();
const AppDogContext = React.createContext();

const initialGrid = Array.from({ length: 100 }, () =>
  Array.from({ length: 100 }, () => Math.random() * 100),
);

function appReducer(state, action) {
  switch (action.type) {
    case 'UPDATE_GRID_CELL': {
      return { ...state, grid: updateGridCellState(state.grid, action) };
    }
    case 'UPDATE_GRID': {
      return { ...state, grid: updateGridState(state.grid) };
    }
    default: {
      throw new Error(`Unhandled action type: ${action.type}`);
    }
  }
}

function dogReducer(state, action) {
  switch (action.type) {
    case 'TYPED_IN_DOG_INPUT': {
      return action.dogName;
    }

    default: {
      throw new Error(`Unhandled action type: ${action.type}`);
    }
  }
}

function AppProvider({ children }) {
  const [state, dispatch] = React.useReducer(appReducer, {
    // 💣 remove the dogName state because we're no longer managing that
    grid: initialGrid,
  });
  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

function DogProvider({ children }) {
  const [state, dispatch] = React.useReducer(dogReducer, '');
  const value = [state, dispatch];

  return (
    <AppDogContext.Provider value={value}>{children}</AppDogContext.Provider>
  );
}

function useAppState() {
  const context = React.useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within the AppProvider');
  }
  return context;
}

function useAppDispatch() {
  const context = React.useContext(AppDispatchContext);
  if (!context) {
    throw new Error('useAppDispatch must be used within the AppProvider');
  }
  return context;
}

function useAppDogName() {
  const context = React.useContext(AppDogContext);
  if (!context) {
    throw new Error('AppDogContext must be used within the AppProvider');
  }
  return context;
}

function Grid() {
  const dispatch = useAppDispatch();
  const [rows, setRows] = useDebouncedState(50);
  const [columns, setColumns] = useDebouncedState(50);
  const updateGridData = () => dispatch({ type: 'UPDATE_GRID' });
  return (
    <AppGrid
      onUpdateGrid={updateGridData}
      rows={rows}
      handleRowsChange={setRows}
      columns={columns}
      handleColumnsChange={setColumns}
      Cell={Cell}
    />
  );
}
Grid = React.memo(Grid);

function Cell({ state: cell, row, column }) {
  const dispatch = useAppDispatch();
  const handleClick = () => dispatch({ type: 'UPDATE_GRID_CELL', row, column });
  return (
    <button
      className="cell"
      onClick={handleClick}
      style={{
        color: cell > 50 ? 'white' : 'black',
        backgroundColor: `rgba(0, 0, 0, ${cell / 100})`,
      }}
    >
      {Math.floor(cell)}
    </button>
  );
}
Cell = withStateSlice(
  Cell,
  (state, { row, column }) => state.grid[row][column],
);

function withStateSlice(Component, slice) {
  const MemoComponent = React.memo(Component);
  function Cell(props, ref) {
    const state = useAppState();
    return <MemoComponent ref={ref} state={slice(state, props)} {...props} />;
  }
  Cell.displayName = `withStateSlice${Component.displayName || Component.name}`;
  return React.memo(React.forwardRef(Cell));
}

// function Cell({ row, column }) {
//   const state = useAppState();

//   const cell = state.grid[row][column];

//   console.log('🚀 ~ cell:', cell);
//   return <CellImpl cell={cell} row={row} column={column} />;
// }
// Cell = React.memo(Cell);

function DogNameInput() {
  // 🐨 replace the useAppState and useAppDispatch with a normal useState here
  // to manage the dogName locally within this component
  // const state = useAppState();
  // const dispatch = useAppDispatch();
  const [dogName, dispatch] = useAppDogName();
  console.log('🚀 ~ dogName:', dogName);

  function handleChange(event) {
    const newDogName = event.target.value;
    // 🐨 change this to call your state setter that you get from useState
    dispatch({ type: 'TYPED_IN_DOG_INPUT', dogName: newDogName });
  }

  return (
    <form onSubmit={e => e.preventDefault()}>
      <label htmlFor="dogName">Dog Name</label>
      <input
        value={dogName.dogName}
        onChange={handleChange}
        id="dogName"
        placeholder="Toto"
      />
      {dogName ? (
        <div>
          <strong>{dogName}</strong>, I've a feeling we're not in Kansas anymore
        </div>
      ) : null}
    </form>
  );
}
function App() {
  const forceRerender = useForceRerender();
  return (
    <div className="grid-app">
      <button onClick={forceRerender}>force rerender</button>
      <div>
        <DogProvider>
          <DogNameInput />
        </DogProvider>
        <AppProvider>
          <Grid />
        </AppProvider>
      </div>
    </div>
  );
}

export default App;

/*
eslint
  no-func-assign: 0,
*/
