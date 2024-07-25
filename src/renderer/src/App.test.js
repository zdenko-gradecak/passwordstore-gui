import { React } from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from './App';
import { ipcRenderer } from 'electron';
import { Request } from 'node-fetch';

const mockPasswordStoreEntries = [
  {
    name: 'Ana',
    path: 'Ana',
    children: [
      {
        name: 'amazon.de',
        path: 'Ana/amazon.de',
        children: [],
      },
    ],
  },
  {
    name: 'Ron',
    path: 'Ron',
    children: [
      {
        name: 'nordvpn.com',
        path: 'Ron/nordvpn.com',
        children: [],
      },
    ],
  },
];

const mockPasswordStoreEntry = `
amazon-password-123
username@amazon.de
Some other content
`;

beforeEach(() => {
  jest.resetAllMocks(); // Reset mocks before each test
  ipcRenderer.invoke = jest.fn();
});

test('displays root level of password list', async () => {
  ipcRenderer.invoke.mockImplementation((channel) => {
    if (channel === 'get-password-store-entries') {
      return Promise.resolve(mockPasswordStoreEntries);
    }
    return Promise.reject(new Error(`Unknown channel: ${channel}`));
  });

  render(<App />);

  expect(await screen.findByText('Ana')).toBeVisible();
  expect(await screen.findByText('Ron')).toBeVisible();
  expect(screen.queryByText('amazon.de')).not.toBeInTheDocument();
  expect(screen.queryByText('nordvpn.com')).not.toBeInTheDocument();
});

test('displays children of expanded password item (and not others)', async () => {
  ipcRenderer.invoke.mockImplementation((channel) => {
    if (channel === 'get-password-store-entries') {
      return Promise.resolve(mockPasswordStoreEntries);
    }
    return Promise.reject(new Error(`Unknown channel: ${channel}`));
  });

  render(<App />);

  const passwordListItems = await screen.findAllByTestId('password-list-item');
  const passwordListItemAna = passwordListItems.find(item => item.textContent.trim() === 'Ana');

  expect(passwordListItemAna).toBeInTheDocument();

  fireEvent.click(passwordListItemAna);

  expect(await screen.findByText('amazon.de')).toBeVisible();
  expect(screen.queryByText('nordvpn.com')).not.toBeInTheDocument();
});

test('displays content off password item', async () => {
  ipcRenderer.invoke.mockImplementation((channel) => {
    if (channel === 'get-password-store-entries') {
      return Promise.resolve(mockPasswordStoreEntries);
    } else if (channel === 'get-password-store-entry') {
      return Promise.resolve(mockPasswordStoreEntry);
    }
    return Promise.reject(new Error(`Unknown channel: ${channel}`));
  });

  render(<App />);

  let passwordListItems = await screen.findAllByTestId('password-list-item');
  const passwordListItemAna = passwordListItems.find(item => item.textContent.trim() === 'Ana');

  fireEvent.click(passwordListItemAna);

  expect(await screen.findByText('amazon.de')).toBeVisible();

  passwordListItems = await waitFor(() => screen.findAllByTestId('password-list-item'));
  const passwordListItemAmazon = passwordListItems.find(item => item.textContent.trim() === 'amazon.de');
  fireEvent.click(passwordListItemAmazon);

  const passwordContentElement = await screen.findByTestId('password-content');

  expect(passwordContentElement).toHaveAttribute('readonly');
  expect(passwordContentElement.value).toBe(`
amazon-password-123
username@amazon.de
Some other content
`);
});

test('edits and saves content of password item', async () => {
  ipcRenderer.invoke.mockImplementation((channel, ...args) => {
    if (channel === 'get-password-store-entries') {
      return Promise.resolve(mockPasswordStoreEntries);
    } else if (channel === 'get-password-store-entry') {
      return Promise.resolve(mockPasswordStoreEntry);
    } else if (channel === 'save-password-store-entry') {
      return Promise.resolve('DONT KNOW');
    }
    return Promise.reject(new Error(`Unknown channel: ${channel}`));
  });

  // Mock request formData to proxy the submitted data
  Request.prototype.formData = jest.fn().mockImplementation(function() {
    const formData = new FormData();
    const requestBody = this.body;

    if (Buffer.isBuffer(requestBody)) {
      const decodedBody = requestBody.toString('utf-8');
      const params = new URLSearchParams(decodedBody);
      params.forEach((value, key) => {
        formData.append(key, value);
      });
    }

    return Promise.resolve(formData);
  });

  render(<App/>);

  const passwordListItems = await screen.findAllByTestId('password-list-item');
  const passwordListItemAna = passwordListItems.find(item => item.textContent.trim() === 'Ana');

  fireEvent.click(passwordListItemAna);

  const passwordListItemAmazon = (await screen.findAllByTestId('password-list-item')).find(item => item.textContent.trim() === 'amazon.de');

  fireEvent.click(passwordListItemAmazon);

  const editButton = await screen.findByTestId('edit-password-entry-button');
  fireEvent.click(editButton);

  await waitFor(() => {
    expect(screen.queryByTestId('save-password-entry-button')).toBeInTheDocument();
  });

  const passwordContentElement = await screen.findByTestId('password-content');
  expect(passwordContentElement).not.toHaveAttribute('readonly');

  const newContent = passwordContentElement.value + '\nNewly added line';

  fireEvent.change(passwordContentElement, {
    target: { value: newContent },
  });

  const saveButton = await screen.findByTestId('save-password-entry-button');
  expect(saveButton).toBeVisible();

  fireEvent.click(saveButton);

  await waitFor(() => {
    expect(screen.queryByTestId('edit-password-entry-button')).toBeInTheDocument();
  });

  expect(ipcRenderer.invoke).toHaveBeenNthCalledWith(6, 'save-password-store-entry', 'Ana/amazon.de', newContent);
});

test('cancel reloads last saved content and returns to viewing mode', async () => {
  ipcRenderer.invoke.mockImplementation((channel, ...args) => {
    if (channel === 'get-password-store-entries') {
      return Promise.resolve(mockPasswordStoreEntries);
    } else if (channel === 'get-password-store-entry') {
      return Promise.resolve(mockPasswordStoreEntry);
    } else if (channel === 'save-password-store-entry') {
      return Promise.resolve('DONT KNOW');
    }
    return Promise.reject(new Error(`Unknown channel: ${channel}`));
  });

  render(<App />);

  // Find and click the password list item for "Ana"
  const passwordListItems = await screen.findAllByTestId('password-list-item');
  const passwordListItemAna = passwordListItems.find(item => item.textContent.trim() === 'Ana');

  fireEvent.click(passwordListItemAna);

  // Find and click the password list item for "amazon.de"
  const passwordListItemAmazon = (await screen.findAllByTestId('password-list-item')).find(item => item.textContent.trim() === 'amazon.de');

  fireEvent.click(passwordListItemAmazon);

  // Find and click the edit button
  const editButton = await screen.findByTestId('edit-password-entry-button');

  fireEvent.click(editButton);

  // Ensure the textarea is editable
  const passwordContentElement = await screen.findByTestId('password-content');
  expect(passwordContentElement.getAttribute('readonly')).toEqual("");


  // Simulate changing the content
  fireEvent.change(passwordContentElement, {
    target: { value: passwordContentElement.value + '\nNewly added line' },
  });

  // Click the cancel button
  const cancelButton = await screen.findByTestId('cancel-password-entry-button');

  fireEvent.click(cancelButton);

  const passwordContentElementAfterClick = await screen.findByTestId('password-content');

  await waitFor(() => {
    expect(screen.queryByTestId('edit-password-entry-button')).toBeVisible();
  });

  // Ensure the component is back to viewing mode
  expect(screen.queryByTestId('cancel-password-entry-button')).not.toBeInTheDocument();
  expect(screen.queryByTestId('save-password-entry-button')).not.toBeInTheDocument();
  expect(screen.queryByTestId('edit-password-entry-button')).toBeInTheDocument();

  // Ensure the content is reloaded to its original value
  expect(passwordContentElementAfterClick).toHaveValue(mockPasswordStoreEntry);
});
