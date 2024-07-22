import { Form, useSubmit } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';

const SearchBar = ({ query }) => {
  const submit = useSubmit();

  return (
    <ul>
      <li>
        <div className="flex items-center text-blue-600">
          <span className="mr-2 mb-3">
            <FiSearch />
          </span>
          <Form className="w-full mb-3">
            <input
              className="border rounded-md w-full p-2 focus:outline-none focus:ring-2 focus:border-transparent focus:ring-blue-500"
              placeholder="Search"
              type="search"
              name="q"
              defaultValue={query ?? undefined}
              onChange={(event) => {
                const isFirstSearch = query == null;
                submit(event.currentTarget.form, {
                  replace: !isFirstSearch,
                });
              }}
            />
          </Form>
        </div>
      </li>
    </ul>
  );
};

export default SearchBar;
