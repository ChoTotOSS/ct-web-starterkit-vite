import { css } from '@linaria/core';
import { Link } from 'react-router-dom';
import theme from 'clad-ui/theme';
import { sx } from 'clad-ui/utils';

const pageClass = css`
  background-color: ${theme.colors.backgroundPrimary};
  ${sx({
    px: 'sm',
    py: 'lg',
  })}
`;

const HomePage = () => {
  return (
    <div className={pageClass}>
      <h2>Welcome to Chotot Vite Framework with Clad UI!</h2>
      <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/123.htm">Detail - clad-ui demo</Link>
        </li>
        <li>
          <Link to="/404">Not found 404 demo</Link>
        </li>
      </ul>
      <p>Version: 0.0.1</p>
      <h3>Testing Clad UI components with React + Vite</h3>
      <p>
        This project demonstrates that clad-ui works seamlessly with Vite and React, 
        providing the same functionality as the Next.js starterkit.
      </p>
    </div>
  );
};

export default HomePage;
