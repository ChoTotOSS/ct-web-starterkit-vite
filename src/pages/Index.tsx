import { css } from '@linaria/core';
import theme from '@chotot/clad-ui/theme';
import { sx } from '@chotot/clad-ui/utils';
import { Button } from '@chotot/clad-ui';

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
      <p>
        <Button variant="default" color="primary">
          Version: 0.0.1
        </Button>
      </p>
      <h3>Testing Clad UI components with React + Vite</h3>
      <p>
        This project demonstrates that @chotot/clad-ui works seamlessly with Vite and React,
        providing the same functionality as the Next.js starterkit.
      </p>
    </div>
  );
};

export default HomePage;
