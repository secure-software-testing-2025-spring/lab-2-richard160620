const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { Application, MailSystem } = require('./main');

test('MailSystem.write returns correct message', () => {
  const mail = new MailSystem();
  const result = mail.write('Alice');
  assert.equal(result, 'Congrats, Alice!');
});

test('MailSystem.send returns true when Math.random > 0.5', (t) => {
  const mail = new MailSystem();

  const originalRandom = Math.random;
  Math.random = () => 0.8;

  try {
    const result = mail.send('Bob', 'Congrats, Bob!');
    assert.equal(result, true);
  } finally {
    Math.random = originalRandom;
  }
});

test('MailSystem.send returns false when Math.random <= 0.5', (t) => {
  const mail = new MailSystem();

  const originalRandom = Math.random;
  Math.random = () => 0.2;

  try {
    const result = mail.send('Bob', 'Congrats, Bob!');
    assert.equal(result, false);
  } finally {
    Math.random = originalRandom;
  }
});

test('Application.getNames reads names from file', async () => {
  const originalReadFile = fs.readFile;
  fs.readFile = (file, encoding, callback) => {
    callback(null, 'Alice\nBob\nCharlie');
  };

  try {
    const app = new Application();
    const [people, selected] = await app.getNames();
    assert.deepEqual(people, ['Alice', 'Bob', 'Charlie']);
    assert.deepEqual(selected, []);
  } finally {
    fs.readFile = originalReadFile;
  }
});

test('Application.getRandomPerson returns correct person by random index', () => {
  const app = new Application();
  app.people = ['Alice', 'Bob', 'Charlie'];

  const originalRandom = Math.random;
  Math.random = () => 0.4; // floor(0.4 * 3) = 1

  try {
    const result = app.getRandomPerson();
    assert.equal(result, 'Bob');
  } finally {
    Math.random = originalRandom;
  }
});

test('Application.selectNextPerson returns null when all selected', () => {
  const app = new Application();
  app.people = ['Alice', 'Bob'];
  app.selected = ['Alice', 'Bob'];

  const result = app.selectNextPerson();
  assert.equal(result, null);
  assert.deepEqual(app.selected, ['Alice', 'Bob']);
});

test('Application.selectNextPerson selects a new person', () => {
  const app = new Application();
  app.people = ['Alice', 'Bob', 'Charlie'];
  app.selected = [];

  app.getRandomPerson = () => 'Charlie';

  const result = app.selectNextPerson();
  assert.equal(result, 'Charlie');
  assert.deepEqual(app.selected, ['Charlie']);
});

test('Application.selectNextPerson retries until unselected person is found', () => {
  const app = new Application();
  app.people = ['Alice', 'Bob', 'Charlie'];
  app.selected = ['Alice'];

  let callCount = 0;
  app.getRandomPerson = () => {
    callCount += 1;
    if (callCount === 1) return 'Alice';
    if (callCount === 2) return 'Alice';
    return 'Bob';
  };

  const result = app.selectNextPerson();
  assert.equal(result, 'Bob');
  assert.deepEqual(app.selected, ['Alice', 'Bob']);
  assert.equal(callCount, 3);
});

test('Application.notifySelected calls write and send for each selected person', () => {
  const app = new Application();
  app.selected = ['Alice', 'Bob'];

  const writeCalls = [];
  const sendCalls = [];

  app.mailSystem.write = (name) => {
    writeCalls.push(name);
    return `Congrats, ${name}!`;
  };

  app.mailSystem.send = (name, context) => {
    sendCalls.push([name, context]);
    return true;
  };

  app.notifySelected();

  assert.deepEqual(writeCalls, ['Alice', 'Bob']);
  assert.deepEqual(sendCalls, [
    ['Alice', 'Congrats, Alice!'],
    ['Bob', 'Congrats, Bob!'],
  ]);
});

test('Application constructor initializes people and selected', async () => {
  const originalReadFile = fs.readFile;
  fs.readFile = (file, encoding, callback) => {
    callback(null, 'Alice\nBob\nCharlie');
  };

  try {
    const app = new Application();

    await new Promise((resolve) => setImmediate(resolve));

    assert.deepEqual(app.people, ['Alice', 'Bob', 'Charlie']);
    assert.deepEqual(app.selected, []);
  } finally {
    fs.readFile = originalReadFile;
  }
});