const fs = require('fs');

jest.mock('fs', () => ({
  readFile: jest.fn(),
}));

const { Application, MailSystem } = require('./main');

describe('MailSystem', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('write should return correct mail content', () => {
    const mail = new MailSystem();
    jest.spyOn(console, 'log').mockImplementation(() => {});

    const result = mail.write('Alice');

    expect(result).toBe('Congrats, Alice!');
    expect(console.log).toHaveBeenCalledWith('--write mail for Alice--');
  });

  test('send should return true when random > 0.5', () => {
    const mail = new MailSystem();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(Math, 'random').mockReturnValue(0.8);

    const result = mail.send('Bob', 'Congrats, Bob!');

    expect(result).toBe(true);
    expect(console.log).toHaveBeenCalledWith('--send mail to Bob--');
    expect(console.log).toHaveBeenCalledWith('mail sent');
  });

  test('send should return false when random <= 0.5', () => {
    const mail = new MailSystem();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(Math, 'random').mockReturnValue(0.2);

    const result = mail.send('Carl', 'Congrats, Carl!');

    expect(result).toBe(false);
    expect(console.log).toHaveBeenCalledWith('--send mail to Carl--');
    expect(console.log).toHaveBeenCalledWith('mail failed');
  });
});

describe('Application', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    fs.readFile.mockReset();
    fs.readFile.mockImplementation((path, encoding, callback) => {
      callback(null, 'Alice\nBob\nCharlie');
    });
  });

  test('getNames should read file and return people with empty selected', async () => {
    const app = new Application();

    const [people, selected] = await app.getNames();

    expect(people).toEqual(['Alice', 'Bob', 'Charlie']);
    expect(selected).toEqual([]);
  });

  test('getRandomPerson should return a person based on mocked random index', () => {
    const app = new Application();
    app.people = ['Alice', 'Bob', 'Charlie'];

    jest.spyOn(Math, 'random').mockReturnValue(0.4);

    const result = app.getRandomPerson();

    expect(result).toBe('Bob');
  });

  test('selectNextPerson should return null when everyone has been selected', () => {
    const app = new Application();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    app.people = ['Alice', 'Bob'];
    app.selected = ['Alice', 'Bob'];

    const result = app.selectNextPerson();

    expect(result).toBeNull();
    expect(console.log).toHaveBeenCalledWith('--select next person--');
    expect(console.log).toHaveBeenCalledWith('all selected');
  });

  test('selectNextPerson should select a new person and add to selected', () => {
    const app = new Application();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    app.people = ['Alice', 'Bob', 'Charlie'];
    app.selected = [];

    jest.spyOn(app, 'getRandomPerson').mockReturnValue('Charlie');

    const result = app.selectNextPerson();

    expect(result).toBe('Charlie');
    expect(app.selected).toEqual(['Charlie']);
  });

  test('selectNextPerson should retry until getting an unselected person', () => {
    const app = new Application();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    app.people = ['Alice', 'Bob', 'Charlie'];
    app.selected = ['Alice'];

    const spy = jest
      .spyOn(app, 'getRandomPerson')
      .mockReturnValueOnce('Alice')
      .mockReturnValueOnce('Alice')
      .mockReturnValueOnce('Bob');

    const result = app.selectNextPerson();

    expect(result).toBe('Bob');
    expect(app.selected).toEqual(['Alice', 'Bob']);
    expect(spy).toHaveBeenCalledTimes(3);
  });

  test('notifySelected should call write and send for every selected person', () => {
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
    expect(writeSpy).toHaveBeenNthCalledWith(1, 'Alice');
    expect(writeSpy).toHaveBeenNthCalledWith(2, 'Bob');

    expect(sendSpy).toHaveBeenCalledTimes(2);
    expect(sendSpy).toHaveBeenNthCalledWith(1, 'Alice', 'Congrats, Alice!');
    expect(sendSpy).toHaveBeenNthCalledWith(2, 'Bob', 'Congrats, Bob!');
  });

  test('constructor should initialize people and selected from getNames', async () => {
    const app = new Application();

    await new Promise(process.nextTick);

    expect(app.people).toEqual(['Alice', 'Bob', 'Charlie']);
    expect(app.selected).toEqual([]);
  });
});