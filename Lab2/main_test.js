const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

// Mock / Stub: must happen before requiring main.js,
// because main.js creates readFile via util.promisify(fs.readFile)
const originalReadFile = fs.readFile;
fs.readFile = (path, encoding, callback) => {
  callback(null, 'Alice\nBob\nCharlie');
};

const { Application, MailSystem } = require('./main');

test.after(() => {
  fs.readFile = originalReadFile;
});

test('MailSystem.write returns correct message', () => {
  const mail = new MailSystem();
  assert.equal(mail.write('Alice'), 'Congrats, Alice!');
});

test('MailSystem.send returns true when Math.random > 0.5', () => {
  const mail = new MailSystem();
  const originalRandom = Math.random;
  Math.random = () => 0.8;

  try {
    assert.equal(mail.send('Bob', 'Congrats, Bob!'), true);
  } finally {
    Math.random = originalRandom;
  }
});

test('MailSystem.send returns false when Math.random <= 0.5', () => {
  const mail = new MailSystem();
  const originalRandom = Math.random;
  Math.random = () => 0.2;

  try {
    assert.equal(mail.send('Bob', 'Congrats, Bob!'), false);
  } finally {
    Math.random = originalRandom;
  }
});

test('Application.getNames reads names correctly', async () => {
  const app = new Application();
  const [people, selected] = await app.getNames();

  assert.deepEqual(people, ['Alice', 'Bob', 'Charlie']);
  assert.deepEqual(selected, []);
});

test('Application.getRandomPerson returns correct person by random index', () => {
  const app = new Application();
  app.people = ['Alice', 'Bob', 'Charlie'];

  const originalRandom = Math.random;
  Math.random = () => 0.4; // floor(0.4 * 3) = 1

  try {
    assert.equal(app.getRandomPerson(), 'Bob');
  } finally {
    Math.random = originalRandom;
  }
});

test('Application.selectNextPerson returns null when all selected', () => {
  const app = new Application();
  app.people = ['Alice', 'Bob'];
  app.selected = ['Alice', 'Bob'];

  assert.equal(app.selectNextPerson(), null);
  assert.deepEqual(app.selected, ['Alice', 'Bob']);
});

test('Application.selectNextPerson selects a new person', () => {
  const app = new Application();
  app.people = ['Alice', 'Bob', 'Charlie'];
  app.selected = [];

  app.getRandomPerson = () => 'Charlie';

  assert.equal(app.selectNextPerson(), 'Charlie');
  assert.deepEqual(app.selected, ['Charlie']);
});

test('Application.selectNextPerson retries until unselected person is found', () => {
  const app = new Application();
  app.people = ['Alice', 'Bob', 'Charlie'];
  app.selected = ['Alice'];

  let count = 0;
  app.getRandomPerson = () => {
    count += 1;
    if (count < 3) return 'Alice';
    return 'Bob';
  };

  assert.equal(app.selectNextPerson(), 'Bob');
  assert.deepEqual(app.selected, ['Alice', 'Bob']);
  assert.equal(count, 3);
});

test('Application.notifySelected calls write and send for every selected person', () => {
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
  const app = new Application();

  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(app.people, ['Alice', 'Bob', 'Charlie']);
  assert.deepEqual(app.selected, []);
});