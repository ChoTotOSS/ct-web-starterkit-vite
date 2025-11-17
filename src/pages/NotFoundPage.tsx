import { css } from '@linaria/core';
import { EmptyState } from '@chotot/clad-ui';
import { Link } from 'react-router-dom';
import theme from '@chotot/clad-ui/theme';
import { sx } from '@chotot/clad-ui/utils';

const pageClass = css`
  background-color: ${theme.colors.backgroundPrimary};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  ${sx({
    px: 'sm',
    py: 'lg',
  })}
`;

const NotFoundPage = () => {
  return (
    <div className={pageClass}>
      <EmptyState buttonLabel="Go back home" type="notFound" />
      <div style={{ marginTop: theme.space.lg }}>
        <Link to="/">Return to Home</Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
