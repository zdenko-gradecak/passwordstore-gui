const { vol } = require('memfs');
import fs from 'fs';
const { exec } = require('child_process');
const path = require('path');

const mockedSettingsFileFolder = '/mocked/userData/path';

jest.mock('../util/electronApp.js', () => ({
  getPath: jest.fn().mockReturnValue(mockedSettingsFileFolder)
}));

const { getSettingsData, saveSettingsData, getPasswordStoreEntries, getPasswordStoreEntry, savePasswordStoreEntry, deletePasswordStoreEntry } = require('../util/passwordstore.js');

jest.mock('fs', () => require('memfs').fs);

const getMockSettingsFilePath = () => {
  return path.join(mockedSettingsFileFolder, 'settings.json');
};
const getMockedSettingsFileContent = () => JSON.stringify({ path: '/home/fake-user/.password-store' });

describe('getSettingsData', () => {
  afterEach(() => {
    vol.reset();
  });

  test('returns the content of settings file as JSON', async () => {
    vol.fromJSON({
      [getMockSettingsFilePath()]: getMockedSettingsFileContent(),
    });

    const result = await getSettingsData();

    expect(result).toEqual(JSON.parse(getMockedSettingsFileContent()));
  });
});

describe('saveSettingsData', () => {
  beforeEach(() => {
    vol.reset();
  });

  test('should save filtered settings data to a file', async () => {
    // Arrange
    vol.fromJSON({
      [getMockSettingsFilePath()]: getMockedSettingsFileContent(),
    });

    const mockData = { path: '/some/path', invalidKey: 'should be removed' };
    const expectedData = JSON.stringify({ path: '/some/path' }, null, 2);

    // Act
    await saveSettingsData(mockData);

    // Assert
    const savedData = await fs.promises.readFile(getMockSettingsFilePath(), 'utf8');
    expect(savedData).toBe(expectedData);
  });

  test('should throw an error for invalid input', async () => {
    await expect(saveSettingsData(null)).rejects.toThrow('Invalid input: settingsDataToSave must be a valid JSON object');
  });
});

describe('getPasswordStoreEntries', () => {
  afterEach(() => {
    vol.reset();
  });

  test('correctly transfers directory hierarchy to JSON data structure (up to 4 levels of depth)', async () => {
    vol.fromJSON({
      [getMockSettingsFilePath()]: getMockedSettingsFileContent(),
      '/home/fake-user/.password-store/level1/level2/level3/level4/file1.gpg': '',
      '/home/fake-user/.password-store/level1/level2/level3/level4/file2.pgp': '',
      '/home/fake-user/.password-store/level1/level2/level3/level4/file3.asc': '',
    });

    const expectedResult = [
      {
        name: 'level1',
        path: 'level1',
        children: [
          {
            name: 'level2',
            path: 'level1/level2',
            children: [
              {
                name: 'level3',
                path: 'level1/level2/level3',
                children: [
                  {
                    name: 'level4',
                    path: 'level1/level2/level3/level4',
                    children: [
                      { name: 'file1', path: 'level1/level2/level3/level4/file1', children: [] },
                      { name: 'file2', path: 'level1/level2/level3/level4/file2', children: [] },
                      { name: 'file3', path: 'level1/level2/level3/level4/file3', children: [] },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    const result = await getPasswordStoreEntries();
    expect(result).toEqual(expectedResult);
  });

  test('excludes patterns correctly', async () => {
    vol.fromJSON({
      [getMockSettingsFilePath()]: getMockedSettingsFileContent(),
      '/home/fake-user/.password-store/folder1/file1.gpg': '',
      '/home/fake-user/.password-store/folder2/file2.pgp': '',
      '/home/fake-user/.password-store/folder3/file3.asc': '',
      '/home/fake-user/.password-store/folder3/file4.txt': '',
    });

    const expectedResult = [
      {
        name: 'folder1',
        path: 'folder1',
        children: [
          {
            name: 'file1',
            path: 'folder1/file1',
            children: [],
          },
        ],
      },
      {
        name: 'folder2',
        path: 'folder2',
        children: [
          {
            name: 'file2',
            path: 'folder2/file2',
            children: [],
          },
        ],
      },
      {
        name: 'folder3',
        path: 'folder3',
        children: [
          {
            name: 'file3',
            path: 'folder3/file3',
            children: [],
          },
        ],
      },
    ];

    const result = await getPasswordStoreEntries(); // Ensure this is awaited since the implementation is async
    expect(result).toEqual(expectedResult);
  });

  test('returns an empty array for an empty directory', async () => {
    vol.fromJSON({
      [getMockSettingsFilePath()]: getMockedSettingsFileContent(),
      '/home/fake-user/.password-store/empty': {},
    });

    const result = await getPasswordStoreEntries('/empty');
    expect(result).toEqual([]);
  });

  test('handles folder not found (incorrect path) case', async () => {
    vol.fromJSON({
      [getMockSettingsFilePath()]: getMockedSettingsFileContent(),
    });

    await expect(getPasswordStoreEntries('/invalid/path')).rejects.toThrow(
      'ENOENT: no such file or directory, scandir \'/home/fake-user/.password-store\''
    );
  });

  test('filters folders and files by given search term', async () => {
    vol.fromJSON({
      [getMockSettingsFilePath()]: getMockedSettingsFileContent(),
      '/home/fake-user/.password-store/Ron/Amazon/aws.gpg': '',
      '/home/fake-user/.password-store/Ron/Google/rons_gmail.gpg': '',
      '/home/fake-user/.password-store/Bob/Google/bobs_gmail.gpg': '',
    });

    // Test filter by folder name
    const expectedResultByFolderName = [
      {
        name: 'Bob',
        path: 'Bob',
        children: [
          {
            name: 'Google',
            path: 'Bob/Google',
            children: [
              {
                name: 'bobs_gmail',
                path: 'Bob/Google/bobs_gmail',
                children: [],
              },
            ],
          },
        ],
      },
      {
        name: 'Ron',
        path: 'Ron',
        children: [
          {
            name: 'Google',
            path: 'Ron/Google',
            children: [
              {
                name: 'rons_gmail',
                path: 'Ron/Google/rons_gmail',
                children: [],
              },
            ],
          },
        ],
      },
    ];

    const resultForSearchByFolderName = await getPasswordStoreEntries('Google');
    expect(resultForSearchByFolderName).toEqual(expectedResultByFolderName);

    // Test filter by file name
    const expectedResultByFileName = [
      {
        name: 'Ron',
        path: 'Ron',
        children: [
          {
            name: 'Amazon',
            path: 'Ron/Amazon',
            children: [
              {
                name: 'aws',
                path: 'Ron/Amazon/aws',
                children: [],
              },
            ],
          },
        ],
      },
    ];

    const resultForSearchByFileName = await getPasswordStoreEntries('aws');
    expect(resultForSearchByFileName).toEqual(expectedResultByFileName);
  });
});

jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

describe('getPasswordStoreEntry', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should execute pass command and return stdout', async () => {
    const mockStdout = 'mocked output';
    exec.mockImplementation((command, callback) => {
      callback(null, mockStdout, null);
    });

    const entryPath = 'Rocketbook("getrocketbook.co.uk")';
    const result = await getPasswordStoreEntry(entryPath);

    expect(exec).toHaveBeenCalledWith(expect.stringContaining('\'Rocketbook("getrocketbook.co.uk")\''), expect.any(Function));
    expect(result).toBe(mockStdout);
  });

  test('should reject with stderr on error', async () => {
    const mockStderr = 'error message';
    exec.mockImplementation((command, callback) => {
      callback(new Error('error'), null, mockStderr);
    });

    const entryPath = 'Rocketbook(getrocketbook.co.uk)';

    await expect(getPasswordStoreEntry(entryPath)).rejects.toEqual(mockStderr);
    expect(exec).toHaveBeenCalledWith(expect.stringContaining('\'Rocketbook(getrocketbook.co.uk)\''), expect.any(Function));
  });
});

describe('savePasswordStoreEntry', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should execute pass command, escape special chars and return stdout', async () => {
    // Arrange
    const mockStdout = 'mocked output';
    exec.mockImplementation((command, callback) => {
      callback(null, mockStdout, null);
    });

    const entryPath = 'Rocketbook(getrocketbook.co.uk)';
    /* eslint-disable */
    const content = `rocket-password
rocket@rocket.com
Some other content
Special chars: \ ' " & | ; $ ( ) < > * ? [ ] { } ~ !
1234567890`;
    /* eslint-enable */

    // Act
    const result = await savePasswordStoreEntry(entryPath, content);

    // Assert
    const escapedPath = 'Rocketbook(getrocketbook.co.uk)';
    /* eslint-disable */
    const escapedContent = `'rocket-password
rocket@rocket.com
Some other content
Special chars:  '\\'' \" & | ; $ ( ) < > * ? [ ] { } ~ !
1234567890'`;
    /* eslint-enable */

    expect(exec).toHaveBeenCalledWith(expect.stringContaining(`echo ${escapedContent} | pass insert -m '${escapedPath}'`), expect.any(Function));
    expect(result).toBe(mockStdout);
  });
});

describe('deletePasswordStoreEntry', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should execute pass command for deletion with escaped special chars and return stdout', async () => {
    // Arrange
    const mockStdout = 'mocked output';
    exec.mockImplementation((command, callback) => {
      callback(null, mockStdout, null);
    });

    const entryPath = 'Rocketbook(getrocketbook.co.uk)';

    // Act
    const result = await deletePasswordStoreEntry(entryPath);

    // Assert
    const escapedPath = 'Rocketbook(getrocketbook.co.uk)';

    expect(exec).toHaveBeenCalledWith(expect.stringContaining(`pass rm '${escapedPath}'`), expect.any(Function));
    expect(result).toBe(mockStdout);
  });
});


