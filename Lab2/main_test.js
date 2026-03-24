const fs = require('fs');

jest.mock('fs', () => ({
  readFile: jest.fn((path, encoding, callback) => {
    callback(null, 'Alice\nBob\nCharlie');
  }),
}));

const { Application, MailSystem } = require('./main');

describe('MailSystem', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('write should return correct content', () => {
    const mail = new MailSystem();
    jest.spyOn(console, 'log').mockImplementation(() => {});

    expect(mail.write('Alice')).toBe('Congrats, Alice!');
  });

  test('send should return true when random > 0.5', () => {
    const mail = new MailSystem();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(Math, 'random').mockReturnValue(0.8);

    expect(mail.send('Bob', 'Congrats, Bob!')).toBe(true);
  });

  test('send should return false when random <= 0.5', () => {
    const mail = new MailSystem();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(Math, 'random').mockReturnValue(0.2);

    expect(mail.send('Bob', 'Congrats, Bob!')).toBe(false);
  });
});

describe('Application', () => {
  beforeEach(() => {
    fs.readFile.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('getNames should return parsed names and empty selected list', async () => {
    const app = new Application();
    const [people, selected] = await app.getNames();

    expect(people).toEqual(['Alice', 'Bob', 'Charlie']);
    expect(selected).toEqual([]);
  });

  test('getRandomPerson should return person by random index', () => {
    const app = new Application();
    app.people = ['Alice', 'Bob', 'Charlie'];

    jest.spyOn(Math, 'random').mockReturnValue(0.4);

    expect(app.getRandomPerson()).toBe('Bob');
  });

  test('selectNextPerson should return null if all people are selected', () => {
    const app = new Application();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    app.people = ['Alice', 'Bob'];
    app.selected = ['Alice', 'Bob'];

    expect(app.selectNextPerson()).toBeNull();
  });

  test('selectNextPerson should select a person and push into selected', () => {
    const app = new Application();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    app.people = ['Alice', 'Bob', 'Charlie'];
    app.selected = [];

    jest.spyOn(app, 'getRandomPerson').mockReturnValue('Charlie');

    expect(app.selectNextPerson()).toBe('Charlie');
    expect(app.selected).toEqual(['Charlie']);
  });

  test('selectNextPerson should retry until an unselected person is found', () => {
    const app = new Application();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    app.people = ['Alice', 'Bob', 'Charlie'];
    app.selected = ['Alice'];

    const randomSpy = jest
      .spyOn(app, 'getRandomPerson')
      .mockReturnValueOnce('Alice')
      .mockReturnValueOnce('Alice')
      .mockReturnValueOnce('Bob');

    expect(app.selectNextPerson()).toBe('Bob');
    expect(app.selected).toEqual(['Alice', 'Bob']);
    expect(randomSpy).toHaveBeenCalledTimes(3);
  });

  test('notifySelected should call write and send for each selected person', () => {
    const app = new Application();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    app.selected = ['Alice', 'Bob'];

    const writeSpy = jest
      .spyOn(app.mailSystem, 'write')
      .mockImplementation((name) => `Congrats, ${name}!`);

    const sendSpy = jest
      .spyOn(app.mailSystem, 'send')
      .mockImplementation(() => true);

    app.notifySelected();

    expect(writeSpy).toHaveBeenCalledTimes(2);
    expect(sendSpy).toHaveBeenCalledTimes(2);
    expect(sendSpy).toHaveBeenNthCalledWith(1, 'Alice', 'Congrats, Alice!');
    expect(sendSpy).toHaveBeenNthCalledWith(2, 'Bob', 'Congrats, Bob!');
  });

  test('constructor should initialize people and selected', async () => {
    const app = new Application();

    await Promise.resolve();
    await Promise.resolve();

    expect(app.people).toEqual(['Alice', 'Bob', 'Charlie']);
    expect(app.selected).toEqual([]);
  });
});