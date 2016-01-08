import {Observable} from 'rx';

// A helper function to get filter function to filter the todo items
// in the virtual dome according to which route we are on.
function getFilterFn(route) {
  switch (route) {
    case '/active': return (task => task.completed === false);
    case '/completed': return (task => task.completed === true);
    default: return () => true; // allow anything
  }
}

// A helper to search for the todo index.
function searchTodoIndex(todosList, todoid) {
  let pointerId;
  let index;
  let top = todosList.length;
  let bottom = 0;
  for (let i = todosList.length - 1; i >= 0; i--) { // binary search
    index = bottom + ((top - bottom) >> 1);
    pointerId = todosList[index].id;
    if (pointerId === todoid) {
      return index;
    } else if (pointerId < todoid) {
      bottom = index;
    } else if (pointerId > todoid) {
      top = index;
    }
  }
  return null;
}

// MAKE MODIFICATION STREAM
// A function that takes the intent on the todo list
// and returns a stream of functions that expect todosData (the data model)
// and return a modified version of the data.
function makeModification$(actions) {
  const clearInputMod$ = actions.clearInput$.map(() => (todosData) => {
    return todosData;
  });

  const insertTodoMod$ = actions.insertTodo$.map((todoTitle) => (todosData) => {
    const lastId = todosData.list.length > 0 ?
      todosData.list[todosData.list.length - 1].id :
      0;
    todosData.list.push({
      id: lastId + 1,
      title: todoTitle,
      completed: false
    });
    return todosData;
  });

  const editTodoMod$ = actions.editTodo$.map(action => (todosData) => {
    const todoIndex = searchTodoIndex(todosData.list, action.id);
    todosData.list[todoIndex].title = action.title;
    return todosData;
  });

  const toggleTodoMod$ = actions.toggleTodo$.map(action => (todosData) => {
    const todoIndex = searchTodoIndex(todosData.list, action.id);
    const previousCompleted = todosData.list[todoIndex].completed;
    todosData.list[todoIndex].completed = !previousCompleted;
    return todosData;
  });

  const toggleAllMod$ = actions.toggleAll$.map(() => (todosData) => {
    const allAreCompleted = todosData.list
      .reduce((x, y) => x && y.completed, true);
    todosData.list.forEach((todoData) => {
      todoData.completed = allAreCompleted ? false : true;
    });
    return todosData;
  });

  const deleteTodoMod$ = actions.deleteTodo$.map(action => (todosData) => {
    const todoIndex = searchTodoIndex(todosData.list, action.id);
    todosData.list.splice(todoIndex, 1);
    return todosData;
  });

  const deleteCompletedsMod$ = actions.deleteCompleteds$.map(() => (todosData) => {
    todosData.list = todosData.list
      .filter(todoData => todoData.completed === false);
    return todosData
  });

  const changeRouteMod$ = actions.changeRoute$.startWith('/').map(route => {
    const filterFn = getFilterFn(route)
    return (todosData) => {
      todosData.filter = route.replace('/', '').trim();
      todosData.filterFn = filterFn;
      return todosData;
    }
  });

  return Observable.merge(
    insertTodoMod$, deleteTodoMod$, toggleTodoMod$, toggleAllMod$,
    clearInputMod$, deleteCompletedsMod$, editTodoMod$, changeRouteMod$
  );
}

// THIS IS THE MODEL FUNCTION
// It expects the actions coming in from the todo items and
// the initial localStorage data.
function model(actions, sourceTodosData$) {
  // THE BUSINESS LOGIC
  // Actions are passed to the `makeModification$` function
  // which creates a stream of modification functions that needs
  // to be applied on the todoData when an action happens.
  const modification$ = makeModification$(actions);

  // RETURN THE MODEL DATA
  // Take the initial localStorage data stream...
  return sourceTodosData$
    // ...and concatenate it with the stream of modification
    // functions...
    .concat(modification$)
    // ...and apply every modification function on the
    // current todosData which is the "accumulater"
    // of this `.scan` function.
    .scan((todosData, modFn) => modFn(todosData))
    // Always serve any subscriber the latest state that
    // was flowing through this Observable.
    .shareReplay(1);
}

export default model;