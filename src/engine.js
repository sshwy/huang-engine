const VERSION = '0.0.1';

const LS = new Proxy({}, {
  set: (target, p, value) => {
    window.localStorage.setItem(p, JSON.stringify(value))
    return true
  },
  get: (target, p) => {
    const raw = window.localStorage.getItem(p)
    if(raw) return JSON.parse(raw)
    return raw
  },
})

function isNumber (o) {
  return Object.prototype.toString.call(o) === '[object Number]';
}

function isArray (o) {
  return Object.prototype.toString.call(o) === '[object Array]';
}

function isString (o) {
  return Object.prototype.toString.call(o) === '[object String]';
}

class GameEngine {
  constructor(el) {
    this.version = VERSION;
    this.status = 'uninitialized';
    this.el = el;

    const gameThis = this;
    this.el.addEventListener('click', function (event) {
      const btn = event.target;
      if (btn) {
        function getAllClass(el) {
          if(el === null) return []
          return getAllClass(el.parentElement).concat(el.classList.value.split(' '))
        }
        function getData(el, p) {
          if(el === null) return undefined
          if(el.dataset[p] !== undefined) return el.dataset[p]
          return getData(el.parentElement, p)
        }

        const list = getAllClass(btn)
        if (list.includes('next-scene-btn')) {
          gameThis.changeScene(btn.dataset.scene,
            JSON.parse(window.atob(btn.dataset.setvar)));
        } else if (list.includes('end-btn')) {
          gameThis.status = 'initialized'
          gameThis.render()
        } else if (list.includes('savedata-btn')) {
          gameThis.displaySaveData ('load')
        } else if (list.includes('save-btn')) {
          gameThis.saveData ()
        } else if (list.includes('savedata-card')) {
          gameThis.initLS()
          const id = getData(btn, 'savedataid')
          if (list.includes('load')) {
            if(LS.savedata[id]) {
              gameThis.current = LS.savedata[id]
              gameThis.status = 'gaming'
              gameThis.render ()
            }

          } else if (list.includes('save')) {
            const arr = LS.savedata;
            arr[id] = gameThis.current
            LS.savedata = arr

            const brr = LS.savetime;
            brr[id] = Date.now()
            LS.savetime = brr

            gameThis.render()
          }
        } else if (list.includes('cancel-savedata')) {
          gameThis.render()
        } else if (list.includes('home-btn')) {
          gameThis.status = 'initialized'
          gameThis.render()
        }
      }
    })
  }
  initLS () {
    if (!isArray(LS.savedata)) {
      LS.savedata = [null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null]
    }
    if (!isArray(LS.savetime)) {
      LS.savetime = [null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null]
    }
  }
  saveData () {
    this.displaySaveData('save')
  }
  displaySaveData (mode) {
    this.initLS()

    const renderSaveData = id => {
      if (LS.savedata[id]) {
        return '<div class="savetime">' 
          + (new Date(LS.savetime[id])).toLocaleString() + '</div>'
      } else {
        return `<div class="empty-savedata">Empty</div>`
      }
    };

    const title = {
      save: '保存',
      load: '加载'
    };

    const html = `<h1>${title[mode]}</h1>`
      + '<div class="savedata-container">'
      + LS.savedata.map((item, idx) =>
        `<div data-savedataid="${idx}" class="savedata-card ${mode}">`
        + `<span class="savedata-card-id">#${idx}</span>`
        + renderSaveData(idx)
        + '</div>'
      ).join('')
      + '</div>'
      + '<div class="btn-group">'
      + '<div class="cancel-savedata btn">返回</div>'
      + '</div>';

    this.el.innerHTML = html
  }
  load (data) {
    this.game = data;

    if (this.game.engineVersion !== VERSION) {
      throw new Error(`Can't load the game whose engine versioned `
        + this.game.engineVersion
        + ' (current engine version ' + this.version + ')');
    }

    if (!isString(this.game.info.version) || !isString(this.game.info.title) ||
      !isString(this.game.info.description)) {
      throw new Error('Invalid game info')
    }

    if (!this.game.scene) {
      throw new Error('Invalid game data: no scene found')
    }

    if (!this.game.scene['$start'] || !this.game.scene['$end']) {
      throw new Error('Invalid game data: no start scene or end scene')
    }

    const checkOperation = s => {
      if (isNumber(s)) return true;
      if (!isString(s)) return false;
      let TMP_VAR = 0;
      try {
        eval(s.replace(/\$VAR/g, 'TMP_VAR'))
        return true
      } catch (e) {
        return false
      }
    };

    const checkSetVar = setVar => {
      for (const name in setVar) {
        if (!this.game.var?.includes(name)) {
          return false
        }
        if (!checkOperation(setVar[name])) {
          return false
        }
      }
      return true
    };

    const checkStory = (scene, id, allScene) => {
      if (!isString(scene.nextScene) || !allScene[scene.nextScene]) {
        throw new Error(`Invalid story scene (id: ${id}): `
          + `invalid nextScene`);
      }

      if (!isArray(scene.content) || !scene.content.every(s => isString(s))) {
        throw new Error(`Invalid story scene (id: ${id}): `
          + `invalid content`);
      }

      if (scene.setVar) {
        if (!checkSetVar(scene.setVar)) {
          throw new Error(`Invalid story scene (id: ${id}): `
            + `invalid setVar`);
        }
      }
    };
    const checkSelection = (scene, id, allScene) => {
      if (!isString(scene.description)) {
        throw new Error(`Invalid selection scene (id: ${id}): `
          + `invalid description`);
      }

      const isChoice = e => {
        return isString(e.title) && isString(e.nextScene)
          && !(!allScene[e.nextScene]) && (!e.setVar || checkSetVar(e.setVar));
      };

      if (!isArray(scene.choices) || !scene.choices.every(e => isChoice(e))) {
        throw new Error(`Invalid selection scene (id: ${id}): `
          + `invalid choices`);
      }
    };
    const checkSwitch = (scene, id, allScene) => {
      if (!isString(scene.switch) || !this.game.var?.includes(scene.switch)) {
        throw new Error(`Invalid switch (id: ${id}): `
          + `invalid switch variable`);
      }

      const isCase = e => {
        return (isString(e.case) || isNumber(e.case)) && isString(e.nextScene)
          && !(!allScene[e.nextScene]);
      };

      if (!isArray(scene.cases) || !scene.cases.every(e => isCase(e))) {
        throw new Error(`Invalid switch (id: ${id}): `
          + `invalid cases`);
      }

      if (!isString(scene.default) || !allScene[scene.default]) {
        throw new Error(`Invalid switch (id: ${id}): `
          + `invalid default scene`);
      }
    }

    const checkers = {
      story: checkStory,
      selection: checkSelection,
      switch: checkSwitch,
      end: () => true,
    };
    const checkScene = (scene, id, allScene) => {
      if (!scene.type) {
        throw new Error(`Invalid scene (id: ${id}): no type found`);
      }

      if (!checkers[scene.type]) {
        throw new Error(`Invalid scene (id: ${id}): unknown type '${scene.type}'`);
      }

      checkers[scene.type](scene, id, allScene);
    };

    for (const key in this.game.scene) {
      checkScene(this.game.scene[key], key, this.game.scene);
    }

    this.status = 'initialized';
  }
  loadSaveData (data) {
    this.current = data;

    if (!isString(this.current.sceneId) || !this.game.scene[this.current.sceneId]) {
      throw new Error(`Invalid save data`)
    }

    this.status = 'gaming'
  }
  initCurrent () {
    const obj = {}
    this.game.var.forEach(name => obj[name] = 0)
    this.current = {
      sceneId: '',
      var: obj
    }
  }
  execSetVar (ops, cur) {
    for (const __name in ops) {
      let __TMP = cur.var[__name]
      const s = ops[__name]
      if (isNumber(s)) {
        cur.var[__name] = s;
      } else {
        cur.var[__name] = eval(s.replace(/\$VAR/g, '__TMP'))
      }
    }
  }
  changeScene (id, setvar) {
    if (this.status === 'initialized' || this.current === undefined) {
      this.initCurrent()
      this.status = 'gaming'
    }
    this.current.sceneId = id;
    this.execSetVar(setvar, this.current)
    this.render();
  }
  render () {
    const renderSetVar = scene => window.btoa(JSON.stringify(scene.setVar || {}))
    const renderSideMenu = id => {
      const html = '<div class="side-menu">'
        + `<div class="home-btn btn">主界面</div>`
        + `<div class="save-btn btn" data-scene="${id}">保存</div>`
        + '</div>'
      return html
    }

    const renderScene = () => {
      const renderStory = id => {
        const scene = this.game.scene[id]
        const html =
          '<div class="story">'
          + scene.content.map(s => '<p>' + s + '</p>').join('')
          + '</div>'
          + '<div class="btn-group">'
          + '<div class="next-scene-btn btn" '
          + `data-scene="${scene.nextScene}" `
          + `data-setvar="${renderSetVar(scene)}"`
          + '>NEXT</div>'
          + '</div>'
          + renderSideMenu(id)

        this.el.innerHTML = html
      };
      const renderSelection = id => {
        const scene = this.game.scene[id]
        const html =
          '<div class="selection-description">'
          + `<p>${scene.description}</p>`
          + '</div>'
          + '<div class="btn-group">'
          + scene.choices.map(item =>
            '<div class="next-scene-btn btn" '
            + `data-scene="${item.nextScene}"`
            + `data-setvar="${renderSetVar(item)}"`
            + '>' + item.title + '</div>'
          ).join('')
          + '</div>'
          + renderSideMenu(id)

        this.el.innerHTML = html
      };
      const renderEnd = id => {
        const html = '<div class="story">'
          + '<p>END.</p>'
          + '</div>'
          + '<div class="btn-group">'
          + '<div class="end-btn btn">BACK TO HOME</div>'
          + '</div>';

        this.el.innerHTML = html
      };
      const renderSwitch = id => {
        const scene = this.game.scene[id]
        const name = scene.switch
        for (const item of scene.cases) {
          const __TMP = this.current.var[name]
          const evalOper = s => isNumber(s) ? s : eval(s.replace(/\$VAR/g, '__TMP'));
          if (this.current.var[name] === evalOper(item.case)) {
            this.changeScene(item.nextScene, item.setVar || {})
            return
          }
        }
        this.changeScene(scene.default, scene.defaultSetVar || {})
      };

      const renderers = {
        story: renderStory,
        selection: renderSelection,
        end: renderEnd,
        switch: renderSwitch
      };

      renderers[this.game.scene[this.current.sceneId].type](this.current.sceneId);
    };
    const renderHome = () => {
      const html = '<div class="game-title">'
        + '<h1>' + this.game.info.title + '</h1>'
        + '<span class="game-version">' + this.game.info.version + '</span>'
        + '</div>'
        + '<div class="btn-group">'
        + `<div class="next-scene-btn btn" data-scene="$start" data-setvar="e30=">开始游戏</div>`
        + `<div class="savedata-btn btn">读取存档</div>`
        + '</div>';
      this.el.innerHTML = html
    };
    const renderError = msg => {
      this.el.innerHTML = `<h1>${msg}</h1>`
    };
    if (this.status === 'uninitialized') {
      renderError('No Game Found')
    } else if (this.status === 'initialized') {
      renderHome();
    } else if (this.status === 'gaming') {
      renderScene();
    }
  }
};

export default GameEngine;