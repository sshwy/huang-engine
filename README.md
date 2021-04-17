# Huang Engine

Huang Engine is an engine for web visual novel (namely gal game), which is currently still experimental.

## Gettings Start

Copy `engine.js` to your project's folder. Use 

```js
import Game from 'path/to/engine.js'
```

to import the engine. It's worth noticing that modern browsers have started to support [module](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) functionality natively, which I recommend you use.

## Usage

Create a new game instance:

```js
const gameRoot = document.getElementById('game-root'); // the element that the game will be mounted
const instance = new Game(gameRoot);
```

Load game data:

```js
const gameData = { /* galgame data */ };
instance.load(gameData);
```

Render the game:

```js
instance.render()
```

## Game Data Format

The `gameData` object contains following main components:

```js
const gameData = {
  engineVersion: '0.0.1',
  info: {
    title: 'Title of the game',
    description: 'Description of the game',
    version: '0.0.0' // version of the game
  },
  var: [], /// global var used in the game
  scene: { // scenes of the game
    $start: SCENE_OBJECT,
    $end: SCENE_OBJECT,
    /* ... */
  }
}
```

Information of the game will be displayed in the home scene. 

Note that the key of a scene is considered as its "id". The scenes must contain `$start` and `$end`.

There are three types of `SCENE_OBJECT`.

### Story

A story scene is configured as

```js
const story_scene = {
  type: 'story',
  content: [
    'The first paragraph',
    'The second paragraph'
    // ...
  ],
  setVar: SET_VAR_OBJECT,
  nextScene: 'id_of_the_next_scene',
}
```

### Selection

A selection scene is configured as

```js
const selection_scene = {
  type: 'selection',
  description: 'If you get an apple, you will:
  choices: [
    {
      title: 'Eat it',
      setVar: SET_VAR_OBJECT,
      nextScene: 'after_eating'
    },
    {
      title: 'Drop it',
      setVar: SET_VAR_OBJECT,
      nextScene: 'after_droping'
    }
    // ...
  ]
}
```

### Switch

A switch scene is used to determine the nextScene via global variables.

It looks like

```js
const switch_scene = {
  type: 'switch',
  switch: 'the_var',
  cases: [
    {
      case: 0,
      nextScene: 'scene_0'
      setVar: SET_VAR_OBJECT,
    },
    {
      case: 1,
      nextScene: 'scene_1'
      setVar: SET_VAR_OBJECT,
    },
    {
      case: '$VAR * $VAR - 4',
      nextScene: 'scene_2'
      setVar: SET_VAR_OBJECT,
    }
    // ...
  ],
  default: 'scene_3' // default next scene
  defaultSetVar: SET_VAR_OBJECT
}
```

The switched variable is denoted by`switch_scene.switch`. You can use not only constant expression to predict its value, but also a string denoting an expression containing the variable itself, written as `$VAR`. We will use `eval()` to implement it.

You must ensure that `the_var` is included in `gameData.var`.

### Operation on Variable

The `SET_VAR_OBJECT` is used to describe operations on variables, which looks like:

```js
const a_example_set_var_object = {
  'the_var': '$VAR + 1',
  'another_var': 0,
  // ...
}
```

Name of the variable is used as key. The operation on it can be a constant expression or a string to be `eval()`, which means assign it to the variable.

I recommend you consider all variables as number.

Ensure names of used variables is included in `gameData.var`.

## Example Game

```js
const exampleGameData = {
  engineVersion: '0.0.1',
  info: {
    title: 'Example Game',
    description: 'A exmple game',
    version: '0.0.0'
  },
  var: ['a'],
  scene: {
    $start: {
      type: 'story',
      content: ['Hello World!'],
      nextScene: 'question_1',
      setVar: {
        'a': 0,
      }
    },
    $end: {
      type: 'end',
    },
    'question_1': {
      type: 'selection',
      description: '1 + 1 = ?',
      choices: [
        {
          title: '1',
          nextScene: 'question_2'
        },
        {
          title: '2',
          setVar: {
            'a': '$VAR + 1'
          },
          nextScene: 'question_2'
        }
      ]
    },
    'question_2': {
      type: 'selection',
      description: '2 + 2 = ?',
      choices: [
        {
          title: '2',
          nextScene: 'switch_scene'
        },
        {
          title: '4',
          setVar: {
            'a': '$VAR + 1'
          },
          nextScene: 'switch_scene'
        }
      ]
    },
    'switch_scene': {
      type: 'switch',
      switch: 'a',
      cases: [
        {
          case: 0,
          nextScene: 'result_0'
        },
        {
          case: 1,
          nextScene: 'result_1'
        },
        {
          case: 2,
          nextScene: 'result_2'
        }
      ],
      default: 'error',
    },
    'result_0': {
      type: 'story',
      content: ['You gain no score.'],
      nextScene: '$end'
    },
    'result_1': {
      type: 'story',
      content: ['You gain 1 score.'],
      nextScene: '$end'
    },
    'result_2': {
      type: 'story',
      content: ['You gain 2 score.'],
      nextScene: '$end'
    },
    'error': {
      type: 'story',
      content: ['error!'],
      nextScene: '$end'
    }
  }
};
```

BTW, it is highly recommended using YAML to store game data and `js-yaml` to parse it.

## LICENSE

MIT.