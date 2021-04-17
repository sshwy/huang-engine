// const Game = require('./engine').default
import Game from './engine.js'
// import jsyaml from './js-yaml.js'

const gameRoot = document.getElementById('game-root');
const instance = new Game(gameRoot);

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

instance.load(exampleGameData);
instance.render()
