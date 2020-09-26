import { ICONS } from './constants';
import Storage from './storage';
import HabiticaApi from './habitica-api';
import User from './user';

export default class Task {
  constructor(
    trello,
    storage = new Storage(trello),
    API = new HabiticaApi(trello, storage),
    user = new User(trello, storage)
  ) {
    this.t = trello;
    this.storage = storage;
    this.API = API;
    this.currentUser = user;
  }

  async getTemplate(card) {
    const cardUrl = `https://trello.com/c/${card.shortLink}`;
    const settings = await this.storage.getSettings();
    const icon = settings.prependIcon ? `![](${ICONS.TRELLO_LOGO})&ensp;` : '';

    return {
      type: 'todo',
      priority: settings.priority,
      text: `${icon}${card.name}`,
      notes: `[Open in Trello](${cardUrl})`
    };
  }

  async handleAdd() {
    const card = await this.t.card('name', 'shortLink');
    const params = await this.getTemplate(card);

    return this.API.addTask(params).then(res =>
      this.storage.setTask({
        id: res.data.id,
        text: res.data.text,
        notes: res.data.notes,
        priority: res.data.priority
      })
    );
  }

  async handleRemove() {
    const task = await this.storage.getTask();

    return this.API.removeTask(task.id).then(() => this.storage.removeTask());
  }

  async handleDo() {
    const task = await this.storage.getTask();

    return this.API.doTask(task.id).then(res =>
      this.storage
        .setTask({ done: true })
        .then(() => this.currentUser.updateStats(res.data))
    );
  }

  async handleUndo() {
    const task = await this.storage.getTask();

    return this.API.undoTask(task.id).then(res =>
      this.storage
        .setTask({ done: false })
        .then(() => this.currentUser.updateStats(res.data))
    );
  }

  async handleUpdate({ priority }) {
    const task = await this.storage.getTask();

    return this.API.updateTask(task.id, { priority }).then(res =>
      this.storage.setTask({
        priority: res.data.priority
      })
    );
  }
}
