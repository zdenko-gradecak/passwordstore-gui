import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import Root, { loader as rootLoader } from './routes/Root';
import ErrorPage from './components/ErrorPage';
import NewPass, { action as newPassAction, loader as newPassLoader } from './routes/NewPass';
import ViewPass, { loader as viewPassLoader} from './routes/ViewPass';
import EditPass, { loader as editPassLoader, action as editPassAction } from './routes/EditPass';
import Index from './routes/Index';
import './assets/index.css';

const router = createHashRouter([
  {
    path: '/',
    element: <Root />,
    errorElement: <ErrorPage />,
    loader: rootLoader,
    children: [
      {
        errorElement: <ErrorPage />,
        children: [
          { index: true, element: <Index /> },
          {
            path: 'pass/new',
            element: <NewPass />,
            loader: newPassLoader,
            action: newPassAction,
          },
          {
            path: 'pass/:passName',
            element: <ViewPass />,
            loader: viewPassLoader,
          },
          {
            path: 'pass/:passName/edit',
            element: <EditPass />,
            loader: editPassLoader,
            action: editPassAction,
          },
          {
            path: 'pass/:passName/destroy',
            // action: destroyAction,
            // errorElement: <div>Oops! There was an error.</div>,
          },
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
