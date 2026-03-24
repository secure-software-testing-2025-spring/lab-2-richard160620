const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const { Application, MailSystem } = require('./main');

test('MailSystem.write', () => {
  const mail = new MailSystem();
  assert.equal(mail.write('Alice'), 'Congrats, Alice!');
});

test('MailSystem.send success', () => {
  const mail = new MailSystem();

  const original = Math.random;
  Math.random = () => 0.9;

  try {
    assert.equal(mail.send('Bob', 'msg'), true);
  } finally {
    Math.random = original;
  }
});

test('MailSystem.send fail', () => {
  const mail = new MailSystem();

  const original = Math.random;
  Math.random = () => 0.1;

  try {
    assert.equal(mail.send('Bob', 'msg'), false);
  } finally {
    Math.random = original;
  }
});

test('getNames', async () => {
  const original = fs.readFile;
  fs.readFile = (p, e, cb) => cb(null, 'Alice\nBob\nCharlie');

  try {
    const app = new Application();
    const [people, selected] = await app.getNames();

    assert.deepEqual(people, ['Alice', 'Bob', 'Charlie']);
    assert.deepEqual(selected, []);
  } finally {
    fs.readFile = original;
  }
});

test('getRandomPerson', () => {
  const app = new Application();
  app.people = ['A', 'B', 'C'];

  const original = Math.random;
  Math.random = () => 0.4;

  try {
    assert.equal(app.getRandomPerson(), 'B');
  } finally {
    Math.random = original;
  }
});

test('selectNextPerson null', () => {
  const app = new Application();
  app.people = ['A'];
  app.selected = ['A'];

  assert.equal(app.selectNextPerson(), null);
});

test('selectNextPerson normal', () => {
  const app = new Application();
  app.people = ['A', 'B'];
  app.selected = [];

  app.getRandomPerson = () => 'B';

  assert.equal(app.selectNextPerson(), 'B');
  assert.deepEqual(app.selected, ['B']);
});

test('selectNextPerson retry', () => {
  const app = new Application();
  app.people = ['A', 'B'];
  app.selected = ['A'];

  let i = 0;
  app.getRandomPerson = () => {
    i++;
    return i < 3 ? 'A' : 'B';
  };

  assert.equal(app.selectNextPerson(), 'B');
  assert.deepEqual(app.selected, ['A', 'B']);
});

test('notifySelected', () => {
  const app = new Application();
  app.selected = ['A', 'B'];

  let writeCount = 0;
  let sendCount = 0;

  app.mailSystem.write = (n) => {
    writeCount++;
    return `Congrats, ${n}!`;
  };

  app.mailSystem.send = () => {
    sendCount++;
    return true;
  };

  app.notifySelected();

  assert.equal(writeCount, 2);
  assert.equal(sendCount, 2);
});

test('constructor init', async () => {
  const original = fs.readFile;
  fs.readFile = (p, e, cb) => cb(null, 'Alice\nBob\nCharlie');

  try {
    const app = new Application();
    await new Promise((r) => setImmediate(r));

    assert.deepEqual(app.people, ['Alice', 'Bob', 'Charlie']);
    assert.deepEqual(app.selected, []);
  } finally {
    fs.readFile = original;
  }
});